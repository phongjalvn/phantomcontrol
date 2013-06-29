angular.module('exampleApp', ['ssAngular'])
    .config(['authProvider', '$routeProvider', '$locationProvider', function (authProvider, $routeProvider, $locationProvider) {
        //noinspection JSUnresolvedFunction
        authProvider.authServiceModule('auth');
        //noinspection JSUnresolvedFunction
        authProvider.loginPath('/login');
        // Route config
        $routeProvider.
            when('/login', {controller: 'AuthCtrl', templateUrl: 'login.html'}).
            when('/dashboard', {controller: 'DashboardCtrl', templateUrl: 'app.html'}).
            // User Manager
            when('/user', {controller: 'UserCtrl', templateUrl: 'usermanager.html'}).
            when('/user/create', {controller: 'UserCtrl', templateUrl: 'usernew.html'}).
            when('/user/:userid', {controller: 'UserCtrl', templateUrl: 'useredit.html'}).
            // Scraper Engine
            when('/site', {controller: 'SiteCtrl', templateUrl: 'sitemanager.html'}).
            when('/site/create', {controller: 'SiteCtrl', templateUrl: 'sitenew.html'}).
            when('/site/:name', {controller: 'SiteCtrl', templateUrl: 'siteedit.html'}).
            // Script Manager
            when('/script', {controller: 'UserCtrl', templateUrl: 'usermanager.html'}).
            when('/script/create', {controller: 'UserCtrl', templateUrl: 'usernew.html'}).
            when('/script/:userid', {controller: 'UserCtrl', templateUrl: 'useredit.html'}).
            otherwise({redirectTo: '/dashboard'});
        $locationProvider.html5Mode(true);
    }])
// Share data between modules
    .factory('ShareData', function (rpc, auth, $location) {
        return {
            menus: [
                {key: "user", icon: "user", title: "User Manager"},
                {key: "site", icon: "bar-chart", title: "Scraper Engine"},
                {key: "script", icon: "file", title: "Script Manager"}
            ],
            username: rpc('user.getCurrentUser'),
            displayname: rpc('user.getName'),
            logout: function () {
                var promise = auth.logout();
                promise.then(function () {
                    $location.path("/");
                });
            }
        };
    })
    .controller('DashboardCtrl', ['$scope', '$location', 'pubsub', 'rpc', 'model', 'auth', 'ShareData', function ($scope, $location, pubsub, rpc, model, auth, ShareData) {
        $scope.location = $location; // Access $location inside the view.
        $scope.sharedata = ShareData; // Access Share Data
        // Update server status
        $scope.linkModel('status', 'serverStatus');
    }])
    .controller('UserCtrl', ['$scope', '$location', 'pubsub', 'rpc', 'model', 'auth', 'ShareData', '$routeParams',
        function ($scope, $location, pubsub, rpc, model, auth, ShareData, $routeParams) {
            $scope.location = $location; // Access $location inside the view.
            $scope.sharedata = ShareData; // Access Share Data
            //noinspection JSUnresolvedVariable
            $scope.username = $routeParams.userid;

            $scope.linkModel('users', 'users');
            // If no userid, this must be create user page
            //noinspection JSUnresolvedVariable
            if ($routeParams.userid) {
                //noinspection JSUnresolvedVariable
                $scope.displayname = rpc('user.getName', $routeParams.userid);
            }

            // Update User
            $scope.updateUser = function () {
                var displayname = $scope.displayname.$$v || $scope.displayname;
                //noinspection JSUnresolvedVariable
                rpc('user.updateUser', $scope.username, $scope.password, $scope.password2, displayname);
                $location.path('/user');
            };

            // Create User
            $scope.createUser = function () {
                //noinspection JSUnresolvedVariable
                rpc('user.createUser', $scope.username, $scope.password, $scope.password2, $scope.displayname);
                $location.path('/user');
            };

            // Delete User
            $scope.deleteUser = function (index) {
                rpc('user.deleteUser', $scope.users[index].userId);
            }

        }])
    .controller('SiteCtrl', ['$scope', '$location', 'pubsub', 'rpc', 'model', 'auth', 'ShareData', '$routeParams',
        function ($scope, $location, pubsub, rpc, model, auth, ShareData, $routeParams) {
            $scope.location = $location; // Access $location inside the view.
            $scope.sharedata = ShareData; // Access Share Data
            // Update server status
            $scope.linkModel('sites', 'sites');
            $scope.site = {
                name: '',
                url: '',
                pageParam: '',
                maxPage: 0,
                pageSuffix: ''
            };
            $scope.sites = {};

            $scope.create = function () {
                console.log($scope.site);
                rpc('site.add', $scope.site);
                $location.path('/site');
            };

            if ($routeParams.name) {
                var siteTmp = rpc('site.get', $routeParams.name);
                $scope.site = siteTmp;
                var checkSiteTmp = setInterval(function () {
                    if (siteTmp.$$v) {
                        clearInterval(checkSiteTmp);
                        $scope.site = siteTmp.$$v;
                    }
                }, 200);
            }

            $scope.delete = function (index) {
                rpc('site.delete', $scope.sites[index].name);
            };

            $scope.update = function () {
                rpc('site.update', $routeParams.name, $scope.site);
                $location.path('/site');
            };

            $scope.run = function (index, isTest) {
                rpc('site.run', $scope.sites[index].name, isTest);
            };
        }])
// This one is copied from original ss-angular example, check the docs
    .controller('AuthCtrl', ['$scope', '$location', '$log', 'auth', 'ShareData', 'rpc', function ($scope, $location, $log, auth, ShareData, rpc) {
        $scope.processAuth = function () {
            $scope.showError = false;
            var promise = auth.login($scope.user, $scope.password);
            promise.then(function (reason) {
                ShareData.username = rpc('user.getCurrentUser');
                ShareData.displayname = rpc('user.getName');
                var newPath = '/dashboard';
                if ($scope.redirectPath) {
                    newPath = $scope.redirectPath;
                }
                $location.path(newPath);
                $log.log(reason);
            }, function (reason) {
                $log.log(reason);
                $scope.showError = true;
                $scope.errorMsg = "Invalid login.";
            });
        };
    }]);
