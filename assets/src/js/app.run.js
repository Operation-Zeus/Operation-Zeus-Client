const shell = require('electron').shell;

angular
  .module('zeus')
  .run(runBlock);

function runBlock($window, $rootScope, $location, $interval) {
  $rootScope.nowPlaying = {};
  $rootScope.podcasts = [];

  Zeus.loadSettings(function (data) {
    if (data.darkTheme === undefined) {
      $rootScope.settings = {
        theme: 'light',
        animations:  true,
        analytics:  true,
        voiceBoost: true,
        smartSpeed: true,
        autoplay:  true,
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

  // $interval(function () {
  //   if (!$rootScope.settings.autoUpdate) {
  //     return;
  //   }
  //
  //   console.log('Updating podcasts...');
  //   for (var i = 0; i < $rootScope.podcasts.length; i++) {
  //     $rootScope.podcasts[i].loading = true;
  //
  //     Zeus.fetchPodcastRSS($rootScope.podcasts[i].rssUrl, false, $rootScope.podcasts[i].id, function (err, podcast, index) {
  //       $rootScope.podcasts[index] = podcast;
  //       $rootScope.podcasts[index].loading = false;
  //       $rootScope.podcasts[index].loading = false;
  //
  //       console.log($rootScope.podcasts);
  //       $scope.$apply();
  //     });
  //   }
  // }, 1000 * 60 * 15); // Update every 15 minutes
}
