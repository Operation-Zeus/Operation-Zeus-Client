const shell = require('electron').shell;

angular
  .module('zeus')
  .run(runBlock);

/* @ngInject */
function runBlock($window, $rootScope, $location, $timeout) {
  $rootScope.nowPlaying = {};
  $rootScope.podcasts = [];

  $timeout(function () {
    Zeus.loadSettings(function (settings) {
      // Use the theme to determine if they have settings
      if (settings.theme === undefined) {
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
        $rootScope.settings = settings;
      }

      Zeus.settings = $rootScope.settings;
      console.log(settings);

      Zeus.loadSavedPodcasts(function (data) {
        console.log(data);
        $rootScope.podcasts = data;
        $rootScope.fullyLoaded = true;

        $rootScope.$apply();
      });
    });
  }, 1000);
}
