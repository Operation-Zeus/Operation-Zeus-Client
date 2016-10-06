const shell = require('electron').shell;

angular
  .module('zeus')
  .run(runBlock);

/* @ngInject */
function runBlock($window, $rootScope, $location, $interval) {
  $rootScope.nowPlaying = {};
  $rootScope.podcasts = [];

  Zeus.loadSettings(function (data) {
    // Use the theme to determine if they have settings
    if (data.theme === undefined) {
      $rootScope.settings = {
        theme: 'light',
        animations:  true,
        analytics:  true,
        voiceBoost: true,
        smartSpeed: true,
        autoPlay:  true,
        volume: 50,
        cacheImages: true,
        autoUpdate: true,
        playback: 'download'
      };
    } else {
      $rootScope.settings = data;
    }

    Zeus.settings = $rootScope.settings;
    Zeus.loadSavedPodcasts(function (data) {
      console.log(data);
      $rootScope.podcasts = data;
      $rootScope.fullyLoaded = true;
    });
  });
}
