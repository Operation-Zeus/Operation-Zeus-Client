
ngRightClick.$inject = ["$parse"];
runBlock.$inject = ["$window", "$rootScope", "$location", "$interval"];
HomePageCtrl.$inject = ["$scope", "$rootScope", "$timeout", "$document", "$mdDialog"];
MainCtrl.$inject = ["$scope", "$rootScope", "$window", "$location", "$document"];
PlayerPageCtrl.$inject = ["$scope", "$rootScope", "$state", "$location", "$interval", "$timeout", "ngAudio"];
SettingPageCtrl.$inject = ["$scope", "$rootScope"];
PodcastPageCtrl.$inject = ["$scope", "$rootScope", "$state", "$location", "$timeout"];function PodcastPanelDirective() {
  return {
    restrict: 'E',
    templateUrl: 'partials/podcast-panel.html'
  }
}

function PreloaderDirective() {
  return {
    restrict: 'E',
    templateUrl: 'partials/preloader.html'
  }
}

function PreloaderSmallDirective() {
  return {
    restrict: 'E',
    templateUrl: 'partials/preloader-small.html'
  }
}

function PreloaderSmallBlueDirective() {
  return {
    restrict: 'E',
    templateUrl: 'partials/preloader-small-blue.html'
  }
}

function PodcastEpisodeDirective() {
  return {
    restrict: 'E',
    templateUrl: 'partials/podcast-episode.html'
  }
}

/* @ngInject */
function ngRightClick($parse) { // Stack overflow is god
  return function(scope, element, attrs) {
    var fn = $parse(attrs.ngRightClick);
    element.bind('contextmenu', function(e) {
      scope.$apply(function() {
        e.preventDefault();
        fn(scope, { $event: e });
      });
    });
  };
}

var zeus = angular.module('zeus', [
  'ui.router',
  'ngAudio',
  'ngAnimate',
  'ngMaterial',
  'ngContextMenu'
]).config(['$stateProvider', function($stateProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      views: {
        'main': {
          templateUrl: 'partials/home.html'
        }
      }
    })
    .state('podcast', {
      url: '/podcast/{id}',
      views: {
        'main': {
          templateUrl: 'partials/podcast.html'
        }
      }
    })
    .state('settings', {
      url: '/settings',
      views: {
        'main': {
          templateUrl: 'partials/settings.html'
        }
      }
    })
    .state('about', {
      url: '/about',
      views: {
        'main': {
          templateUrl: 'partials/about.html'
        }
        // 'player': { }
      }
    })
    .state('playPodcast', {
      url: '/play/{podcast}/{episode}',
      views: {
        'main': {
          templateUrl: 'partials/player.html'
        }
      }
    });
}]);

angular
  .module('zeus')
  .directive('podcastPanel', PodcastPanelDirective)
  .directive('preloader', PreloaderDirective)
  .directive('preloaderSmall', PreloaderSmallDirective)
  .directive('preloaderSmallBlue', PreloaderSmallBlueDirective)
  .directive('podcastEpisode', PodcastEpisodeDirective)
  .directive('ngRightClick', ngRightClick);

Number.prototype.round = function (p) {
  p = p || 10;
  return parseFloat(this.toFixed(p));
};

const shell = require('electron').shell;

angular
  .module('zeus')
  .run(runBlock);

/* @ngInject */
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

const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

// const menu = new Menu();
const template = [
  {
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  },
  {
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.reload();
      }
    }
  },
  {
    label: 'Toggle Dev. Tools',
    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
    click: function (item, focusedWindow) {
      if (focusedWindow) {
        focusedWindow.webContents.toggleDevTools();
      }
    }
  }
];

const menu = Menu.buildFromTemplate(template);

// $(document).on('contextmenu', function (e) {
//   e.preventDefault();
//   menu.popup(remote.getCurrentWindow());
// });

angular
  .module('zeus')
  .controller('HomePageCtrl', HomePageCtrl);

/* @ngInject */
function HomePageCtrl($scope, $rootScope, $timeout, $document, $mdDialog) {
  $scope.podcasts = $rootScope.podcasts;
  console.log($scope.podcasts);

  $scope.closePodcastModal = function () {
    $mdDialog.hide();
  };

  $scope.openPodcastModal = function (e) {
    $mdDialog.show({
      parent: angular.element(document.body),
      targetEvent: e,
      clickOutsideToClose: true,
      contentElement: '#addPodcastModal'
    });
  };

  $scope.addNewPodcast = function (podcastInfo) {
    $scope.podcastInfo.hasError = false;
    $scope.loadingRSSFeed = true;

    if (!podcastInfo.url.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/)) {
      $scope.podcastInfo.errorMessage = 'Invalid URL';
      $scope.podcastInfo.hasError = true;
      $scope.loadingRSSFeed = false;
      return;
    }

    Zeus.fetchPodcastRSS(podcastInfo.url, true, null, function (err, podcast) {
      if (err || !podcast) {
        $scope.podcastInfo.errorMessage = 'Error: ' + String(err);
        $scope.podcastInfo.hasError = true;
        $scope.loadingRSSFeed = false;
        return;
      }

      $scope.podcastInfo.url = '';
      $scope.loadingRSSFeed = false;

      $timeout(function () {
        $mdDialog.hide();
        $scope.loadingPodcasts = false;

        $scope.$apply();
      }, 2000); // Give image time to download
    });
  };

  $scope.refreshAllPodcasts = function () {
    for (var i = 0; i < $scope.podcasts.length; i++) {
      $rootScope.podcasts[i].loading = true;

      Zeus.fetchPodcastRSS($scope.podcasts[i].rssUrl, false, $scope.podcasts[i].id, function (err, podcast, index) {
        $rootScope.podcasts[index] = podcast;
        $rootScope.podcasts[index].loading = false;
        $scope.podcasts[index].loading = false;

        console.log($rootScope.podcasts);
        $scope.$apply();
      });
    }
  };

  // On right-click, select our podcast
  $scope.selectPodcast = function (podcast, $event) {
    // Unselect all other podcasts
    $scope.handlePodcastUnselect($event);

    $scope.podcasts[podcast.id].selected = true;
  };

  // On every other click, remove that selection
  $scope.handlePodcastUnselect = function($event) {
    // Keep the selection if using the context menu
    if (angular.element($event.srcElement).parent().attr('data-context-menu')) {
      return;
    }

    // Remove selection from all others
    for (var i = 0; i < $scope.podcasts.length; i++) {
      $scope.podcasts[i].selected = false;
    }
  };

  $document.on('click', function ($event) {
    $scope.handlePodcastUnselect($event);
  });
}

angular
  .module('zeus')
  .controller('MainCtrl', MainCtrl);

/* @ngInject */
function MainCtrl($scope, $rootScope, $window, $location, $document) {
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
}

angular
  .module('zeus')
  .controller('PlayerPageCtrl', PlayerPageCtrl);

/* @ngInject */
function PlayerPageCtrl($scope, $rootScope, $state, $location, $interval, $timeout, ngAudio) {
  $scope.showNotes = false;
  $scope.alreadyCanPlayed = false;
  $scope.podcast = $rootScope.podcasts[$state.params.podcast];
  $scope.episode = $rootScope.podcasts[$state.params.podcast].podcasts[$state.params.episode];
  $scope.episode.playbackURL = '../../userdata/podcasts/' + $scope.episode.hash + '.mp3';

  $rootScope.nowPlaying.playing = true;
  $rootScope.nowPlaying.podcastId = $state.params.podcast;
  $rootScope.nowPlaying.episodeId = $state.params.episode;

  var updateInterval = null;

  ngAudio.unlock = undefined;
  $scope.sound = ngAudio.load($scope.episode.playbackURL);

  $scope.playback = {
    currentlyPlaying: false,
    hoverTime: '0:00:00',
    tooltipLeft: 0,
    tooltipTop: 0,
    showHoverPosition: false,
    volume: $rootScope.settings.volume,
    lastEpisode: function () {
      $location.url('/play/' + $state.params.podcast + '/' + (parseInt($state.params.episode) + 1));
      $scope.sound.pause();
    },
    replay10Seconds: function () {
      $scope.sound.currentTime -= 10;
    },
    playPodcast: function () {
      $scope.playback.currentlyPlaying = true;
      $scope.sound.play();

      updateInterval = $interval(function () {
        $scope.episode.currentTime = $scope.sound.currentTime;
        Zeus.updateSavedPodcast($scope.podcast);
      }, 1000 * 30);
    },
    pausePodcast: function () {
      $scope.playback.currentlyPlaying = false;
      $scope.sound.pause();

      if (angular.isDefined(updateInterval)) {
        $interval.cancel(updateInterval);
        updateInterval = undefined;
      }
    },
    forward30Seconds: function () {
      $scope.sound.currentTime += 30;
    },
    nextEpisode: function () {
      $location.url('/play/' + $state.params.podcast + '/' + (parseInt($state.params.episode) - 1));
      $scope.sound.pause();
    },
    goToPosition: function (e) {
      var totalWidth = document.getElementsByTagName('md-progress-linear')[0].clientWidth;
      var clickedAt = e.offsetX;

      var percent = (clickedAt / totalWidth).round(4);
      $scope.sound.currentTime = Math.round(($scope.sound.remaining + $scope.sound.currentTime) * percent);
    },
    showPosition: function (e) {
      var totalWidth = document.getElementsByTagName('md-progress-linear')[0].clientWidth;
      var clickedAt = e.offsetX;

      var percent = (clickedAt / totalWidth).round(4);
      $scope.playback.hoverTime = parseTime(Math.floor(($scope.sound.remaining + $scope.sound.currentTime) * percent));

      $scope.playback.tooltipLeft = e.pageX - 28;
      $scope.playback.tooltipTop = angular.element(document.querySelector('md-progress-linear')).prop('offsetTop') - 23;
      $scope.playback.showHoverPosition = true;
    }
  };

  // Because ng-bind-html-template hates me.
  angular.element(document.querySelector('[data-bind="episode.description"]')).html($scope.episode.description);

  $scope.sound.volume = $scope.playback.volume / 100; // Set initial volume
  $scope.$watch('playback.volume', function () { // Watch for changes, so we can set the volume
    $scope.sound.volume = $scope.playback.volume / 100;
  });

  $scope.$watch('sound.canPlay', function () {
    // This gets called TWICE, even though it should only be called once. So we have a temp variable to make sure we only run this once
    if ($scope.alreadyCanPlayed) {
      return;
    }

    $scope.alreadyCanPlayed = true;
    $scope.sound.currentTime = $scope.episode.currentTime || 0;  // Load saved time

    // For some reason, we get a "currently in digest" error if we click immediately. So wait partially.
    $timeout(function () {
      document.querySelector('span[ng-click="playback.playPodcast()"]').click();
    }, 100);
  });
};

function parseTime(input) {
  var totalSec = input;
  var output = '';
  var hours = 0;
  var minutes = 0;
  var seconds = 0;

  if (totalSec > 3599) {
    hours = Math.floor(totalSec / 3600);
    minutes = Math.floor((totalSec - (hours * 3600)) / 60);
    seconds = (totalSec - ((minutes * 60) + (hours * 3600)));
    if (hours.toString().length == 1) {
      hours = '0' + (Math.floor(totalSec / 3600)).toString();
    }
    if (minutes.toString().length == 1) {
      minutes = '0' + (Math.floor((totalSec - (hours * 3600)) / 60)).toString();
    }
    if (seconds.toString().length == 1) {
      seconds = '0' + (totalSec - ((minutes * 60) + (hours * 3600))).toString();
    }
    output = hours + ':' + minutes + ':' + seconds;
  } else if (totalSec > 59) {
    minutes = Math.floor(totalSec / 60);
    seconds = totalSec - (minutes * 60);
    if (minutes.toString().length == 1) {
      minutes = '0' + (Math.floor(totalSec / 60)).toString();
    }
    if (seconds.toString().length == 1) {
      seconds = '0' + (totalSec - (minutes * 60)).toString();
    }
    output = minutes + ':' + seconds;
  } else {
    seconds = totalSec;
    if (seconds.toString().length == 1) {
      seconds = '0' + (totalSec).toString();
    }

    output = (totalSec < 10 ? '00:0' : '00:') + totalSec;
  }

  return output;
}

angular
  .module('zeus')
  .controller('PodcastPageCtrl', PodcastPageCtrl);

function PodcastPageCtrl($scope, $rootScope, $state, $location, $timeout) {
  $scope.podcast = $rootScope.podcasts[$state.params.id];

  $scope.showUnplayedOnly = true;
  if (!$scope.podcast) {
    $location.url('/');
    return;
  }

  for (var i = 0; i < $scope.podcast.podcasts.length; i++) {
    $scope.podcast.podcasts[i].downloading = false;
  }

  $scope.downloadEpisode = function (id) {
    $scope.podcast.podcasts[id].downloading = true;
    $scope.podcast.podcasts[id].downloadPercent = 0;

    Zeus.downloadEpisode($scope.podcast.podcasts[id], function (error, success, percent) {
      if (percent != 1) {
        console.log(percent);
        $scope.podcast.podcasts[id].downloadPercent = percent;
        $scope.$apply();
        return;
      }

      $scope.podcast.podcasts[id].downloadPercent = 1;
      $scope.$apply();

      $timeout(function () {
        $scope.podcast.podcasts[id].downloading = false;
        $scope.podcast.podcasts[id].isDownloaded = true;
      }, 1000);
    });
  };

  $scope.deleteEpisode = function (id) {
    Zeus.deleteEpisode($scope.podcast.podcasts[id], function (success) {
      if (success) {
        $scope.podcast.podcasts[id].isDownloaded = false;
      }
    });
  };

  $scope.playPodcast = function (podcast, episode) {
    if ($scope.podcast.podcasts[episode].isDownloaded) {
      $location.url('/play/' + podcast + '/' + episode);
    }
  };

  $scope.markAsWatched = function (id) {
    $scope.podcast.podcasts[id].watched = true;
    Zeus.updateSavedPodcast($scope.podcast);
  };
};

angular
  .module('zeus')
  .controller('SettingPageCtrl', SettingPageCtrl);

/* @ngInject */
function SettingPageCtrl($scope, $rootScope) {
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
}
