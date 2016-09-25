zeus.controller('SettingPageCtrl', ['$scope', '$rootScope', function ($scope, $rootScope) {
  $scope.showAdvancedSettings = false;
  $scope.settings = $rootScope.settings;

  $scope.saveSettings = function () {
    $rootScope.settings = $scope.settings;

    Zeus.saveSettings($rootScope.settings);
  };

  $scope.revertSettings = function () {
    $scope.settings = {
      theme: 'light',
      animations: true,
      analytics: true,
      smartSpeed: true,
      voiceBoost: true,
      autoPlay: true,
      volume: 50,
      cacheImages: true,
      autoUpdate: true,
      playback: 'download'
    };

    $scope.saveSettings();
  };
}]);
