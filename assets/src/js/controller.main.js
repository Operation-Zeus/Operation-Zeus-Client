zeus.controller('MainCtrl', ['$scope', '$rootScope', '$route', '$window', '$location', function ($scope, $rootScope, $route, $window, $location) {
  // A scope!
  $rootScope.$on('$routeChangeError', function (event, curr, prev, rejection) {
    if (!prev) {
      $location.url('/');
      return;
    }

    $window.history.back();
  });

  $rootScope.$on('$routeChangeSuccess', function () {
    $('.tooltipped').tooltip('remove');
  });

  $scope.hideFrame = function () {
    Main.hideWindow();
  };

  $scope.closeFrame = function () {
    Main.closeWindow();
  }
}]);
