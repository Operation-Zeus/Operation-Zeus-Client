zeus.controller('SettingPageCtrl', ['$scope', '$rootScope', function ($scope, $rootScope) {
  $scope.settings = $rootScope.settings;

  $scope.saveSettings = function () {
    $rootScope.settings = {
      theme: $scope.settings.theme,
      animations: $scope.settings.animations,
      analytics: $scope.settings.analytics,
      autoplay: $scope.settings.autoplay,
      volume: $scope.settings.volumeRange,
      cacheImages: $scope.settings.cacheImages,
      autoUpdate: $scope.settings.autoUpdate,
      playback: $scope.settings.playback
    };

    Zeus.saveSettings($rootScope.settings);
  };
}]);
