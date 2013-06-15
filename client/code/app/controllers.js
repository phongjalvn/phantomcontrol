angular.module('exampleApp', ['ssAngular'])
.config(['authProvider','$routeProvider','$locationProvider',function(authProvider,$routeProvider,$locationProvider) {
  authProvider.authServiceModule('auth');
  authProvider.loginPath('/login');
  $routeProvider.
  when('/login', {controller:'AuthCtrl', templateUrl:'login.html'}).
  when('/dashboard', {controller:'DashboardCtrl', templateUrl:'app.html'}).
  when('/user', {controller:'UserCtrl', templateUrl:'usermanager.html'}).
  when('/user/create', {controller:'UserCtrl', templateUrl:'usernew.html'}).
  when('/user/:userid', {controller:'UserCtrl', templateUrl:'useredit.html'}).
  when('/file', {controller:'DashboardCtrl', templateUrl:'app.html'}).
  otherwise({redirectTo:'/dashboard'});
  $locationProvider.html5Mode(true);
}])
.factory('ShareData', function(rpc, auth, $location) {
  return {
    menus: [{key: "user", title: "User Manager"},
    {key: "file", title: "Script Manager"}],
    username: rpc('user.getCurrentUser'),
    displayname: rpc('user.getName'),
    logout: function() {
      var promise = auth.logout();
      promise.then(function() { 
        $location.path("/"); 
      });
    }
  };
})
.controller('DashboardCtrl',['$scope','$location','pubsub','rpc','model','auth','ShareData', function($scope,$location,pubsub,rpc,model,auth,ShareData) {
    $scope.location = $location; // Access $location inside the view.
    $scope.sharedata = ShareData; // Access Share Data
    // Update server status
    $scope.linkModel('status','serverStatus');
  }])
.controller('UserCtrl',['$scope','$location','pubsub','rpc','model','auth','ShareData','$routeParams',
  function($scope,$location,pubsub,rpc,model,auth,ShareData,$routeParams) {
    $scope.location = $location; // Access $location inside the view.
    $scope.sharedata = ShareData; // Access Share Data
    $scope.username = $routeParams.userid;

    $scope.linkModel('users','users');
    // If no userid, this must be create user page
    if ($routeParams.userid) {
      $scope.displayname = rpc('user.getName', $routeParams.userid);
    };
    
    // Update User
    $scope.updateUser = function(){
      rpc('user.updateUser', $scope.username, $scope.password, $scope.password2, $scope.displayname);
      $location.path('/user');
    };

    // Create User
    $scope.createUser = function(){
      rpc('user.createUser', $scope.username, $scope.password, $scope.password2, $scope.displayname);
      $location.path('/user');
    };

    // Delete User
    $scope.deleteUser = function(index){
      rpc('user.deleteUser',$scope.users[index].userId);
    }

  }])
.controller('AuthCtrl',['$scope', '$location', '$log', 'auth','ShareData','rpc', function($scope, $location, $log, auth, ShareData, rpc) {
  $scope.processAuth = function() {
    $scope.showError = false;
    var promise = auth.login($scope.user, $scope.password);
    promise.then(function(reason) {
      ShareData.username= rpc('user.getCurrentUser');
      ShareData.displayname= rpc('user.getName');
      var newPath = '/dashboard';
      if($scope.redirectPath) {
        newPath = $scope.redirectPath;
      }
      $location.path(newPath);
    }, function(reason) {
      $log.log(reason);
      $scope.showError = true;
      $scope.errorMsg = "Invalid login.";
    });
  };
}]);
