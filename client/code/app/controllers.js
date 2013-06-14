angular.module('exampleApp', ['ssAngular'])
.config(['authProvider','$routeProvider','$locationProvider',function(authProvider,$routeProvider,$locationProvider) {
  authProvider.authServiceModule('auth');
  authProvider.loginPath('/login');
  $routeProvider.
  when('/login', {controller:'AuthCtrl', templateUrl:'login.html'}).
  when('/app', {controller:'SSCtrl', templateUrl:'app.html'}).
  when('/user', {controller:'UserCtrl', templateUrl:'usermanager.html'}).
  when('/user/create', {controller:'UserCtrl', templateUrl:'usernew.html'}).
  when('/user/:userid', {controller:'UserCtrl', templateUrl:'useredit.html'}).
  when('/file', {controller:'UserCtrl', templateUrl:'app.html'}).
  otherwise({redirectTo:'/app'});
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
.controller('SSCtrl',['$scope','$location','pubsub','rpc','model','auth','ShareData', function($scope,$location,pubsub,rpc,model,auth,ShareData) {
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
    // If no userid, this must be create user page
    if ($routeParams.userid) {
      $scope.displayname = rpc('user.getName', $routeParams.userid);
    };

    if ($location.path() == '/user') {
      $scope.users = rpc('user.getUsers');
    };

    $scope.updateUser = function(){
      ss.rpc('user.updateUser', $scope.username, $scope.password, $scope.password2, $scope.displayname.$$v, function(msg){
        if (msg==true) {
          $.jGrowl('Saved - '+$scope.displayname.$$v, {
            header: "Update User",
            speed: 'slow',
            theme: 'success'
          });
        } else {
          $.jGrowl('Error when saving - '+$scope.displayname.$$v, {
            header: "Update User",
            speed: 'slow',
            theme: 'danger'
          });
        };
      });
    };

    // Create User
    $scope.createUser = function(){
      ss.rpc('user.createUser', $scope.username, $scope.password, $scope.password2, $scope.displayname, function(msg){
        if (msg==true) {
          $.jGrowl('Created - '+$scope.displayname, {
            header: "Create User",
            speed: 'slow',
            theme: 'success'
          });
        } else {
          $.jGrowl('Error when create new user', {
            header: "Create User",
            speed: 'slow',
            theme: 'danger'
          });
        };
      });
    };

    // Delete User
    $scope.deleteUser = function(index){
      ss.rpc('user.deleteUser',$scope.users.$$v[index].userId);
    }

  }])
.controller('AuthCtrl',['$scope', '$location', '$log', 'auth','ShareData','rpc', function($scope, $location, $log, auth, ShareData, rpc) {
  $scope.processAuth = function() {
    $scope.showError = false;
    var promise = auth.login($scope.user, $scope.password);
    promise.then(function(reason) {
      ShareData.username= rpc('user.getCurrentUser');
      ShareData.displayname= rpc('user.getName');
      $log.log(reason);
      var newPath = '/app';
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
