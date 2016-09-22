zeus.controller('MainCtrl', ['$scope', '$rootScope'/*, '$route'*/, '$window', '$location', '$document', function ($scope, $rootScope/*, $route*/, $window, $location, $document) {
  $rootScope.$on('$routeChangeError', function (event, curr, prev, rejection) {
    if (!prev) {
      $location.url('/');
      return;
    }

    $window.history.back();
  });

  $scope.hideFrame = function () {
    Main.hideWindow();
  };

  $scope.closeFrame = function () {
    Main.closeWindow();
  };

  /**
   * My home-grown solution to opening external links in the browser
   * Semi-based off of http://stackoverflow.com/a/34503161/4288525
   */
  $document.on('click', function (e) {
    if (e.srcElement.href && e.srcElement.href.includes('http')) {
      shell.openExternal(e.srcElement.href);
      e.preventDefault();
    }
  });
}]);
