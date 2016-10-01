"use strict";

ngRightClick.$inject = ["$parse"];
routeConfig.$inject = ["$stateProvider", "$locationProvider"];
runBlock.$inject = ["$window", "$rootScope", "$location", "$interval"];
HomePageCtrl.$inject = ["$scope", "$rootScope", "$timeout", "$document", "$q", "$mdDialog"];
MainCtrl.$inject = ["$scope", "$rootScope", "$window", "$location", "$document"];
PlayerPageCtrl.$inject = ["$scope", "$rootScope", "$state", "$location", "$interval", "$timeout", "hotkeys", "ngAudio"];
SettingPageCtrl.$inject = ["$scope", "$rootScope"];
PodcastPageCtrl.$inject = ["$scope", "$rootScope", "$state", "$location", "$timeout"];function PodcastPanelDirective() {
  return {
    restrict: 'E',
    templateUrl: 'partials/directives/podcast-panel.html'
  };
}

function PreloaderDirective() {
  return {
    restrict: 'E',
    templateUrl: 'partials/directives/preloader.html'
  };
}

function PreloaderSmallDirective() {
  return {
    restrict: 'E',
    templateUrl: 'partials/directives/preloader-small.html'
  };
}

function PreloaderSmallBlueDirective() {
  return {
    restrict: 'E',
    templateUrl: 'partials/directives/preloader-small-blue.html'
  };
}

function PodcastEpisodeDirective() {
  return {
    restrict: 'E',
    templateUrl: 'partials/directives/podcast-episode.html'
  };
}

/* @ngInject */
function ngRightClick($parse) {
  // Stack overflow is god
  return function (scope, element, attrs) {
    var fn = $parse(attrs.ngRightClick);
    element.bind('contextmenu', function (e) {
      scope.$apply(function () {
        e.preventDefault();
        fn(scope, { $event: e });
      });
    });
  };
}

var zeus = angular.module('zeus', ['ui.router', 'ngAudio', 'ngAnimate', 'ngMaterial', 'ngContextMenu', 'cfp.hotkeys']).config(routeConfig).config(["hotkeysProvider", function (hotkeysProvider) {
  /* @ngInject */

  hotkeysProvider.includeCheatSheet = false;
}]);

angular.module('zeus').directive('podcastPanel', PodcastPanelDirective).directive('preloader', PreloaderDirective).directive('preloaderSmall', PreloaderSmallDirective).directive('preloaderSmallBlue', PreloaderSmallBlueDirective).directive('podcastEpisode', PodcastEpisodeDirective).directive('ngRightClick', ngRightClick);

Number.prototype.round = function (p) {
  p = p || 10;
  return parseFloat(this.toFixed(p));
};

/* @ngInject*/
function routeConfig($stateProvider, $locationProvider) {
  $stateProvider.state('home', {
    url: '/',
    views: {
      'main': {
        templateUrl: 'partials/home.html'
      }
    }
  }).state('podcast', {
    url: '/podcast/{id}',
    views: {
      'main': {
        templateUrl: 'partials/podcast.html'
      }
    }
  }).state('settings', {
    url: '/settings',
    views: {
      'main': {
        templateUrl: 'partials/settings.html'
      }
    }
  }).state('about', {
    url: '/about',
    views: {
      'main': {
        templateUrl: 'partials/about.html'
      }
    }
  }).state('playPodcast', {
    url: '/play/{podcast}/{episode}',
    views: {
      'main': {
        templateUrl: 'partials/player.html'
      }
    }
  });
}

var shell = require('electron').shell;

angular.module('zeus').run(runBlock);

/* @ngInject */
function runBlock($window, $rootScope, $location, $interval) {
  $rootScope.nowPlaying = {};
  $rootScope.podcasts = [];

  Zeus.loadSettings(function (data) {
    if (data.darkTheme === undefined) {
      $rootScope.settings = {
        theme: 'light',
        animations: true,
        analytics: true,
        voiceBoost: true,
        smartSpeed: true,
        autoPlay: true,
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

var remote = require('electron').remote;
var Menu = remote.Menu;
var MenuItem = remote.MenuItem;

// const menu = new Menu();
var template = [{
  label: 'Copy',
  accelerator: 'CmdOrCtrl+C',
  role: 'copy'
}, {
  label: 'Reload',
  accelerator: 'CmdOrCtrl+R',
  click: function click(item, focusedWindow) {
    if (focusedWindow) {
      focusedWindow.reload();
    }
  }
}, {
  label: 'Toggle Dev. Tools',
  accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
  click: function click(item, focusedWindow) {
    if (focusedWindow) {
      focusedWindow.webContents.toggleDevTools();
    }
  }
}];

var menu = Menu.buildFromTemplate(template);

// $(document).on('contextmenu', function (e) {
//   e.preventDefault();
//   menu.popup(remote.getCurrentWindow());
// });

angular.module('zeus').controller('HomePageCtrl', HomePageCtrl);

/* @ngInject */
function HomePageCtrl($scope, $rootScope, $timeout, $document, $q, $mdDialog) {
  var podcastAutocompleteTimer;
  $scope.podcasts = $rootScope.podcasts;
  $scope.podcastInfo = {};
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

  /**
   * Called from the auto-complete, sets a timeout before loading itunes results
   * @param {STRING} podcastName
   */
  $scope.searchForPodcast = function (podcastName) {
    var deferred = $q.defer();
    console.log(podcastName);

    // Wait 2 seconds (for them to stop typing) before going
    $timeout.cancel(podcastAutocompleteTimer);
    podcastAutocompleteTimer = $timeout(function () {
      loadPodcastSearchResults(podcastName, deferred);
    }, 2000);

    return deferred.promise;
  };

  $scope.autocompleteSelectItem = function (podcast) {
    $scope.podcastInfo.url = podcast.feedUrl;
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
  $scope.handlePodcastUnselect = function ($event) {
    // Keep the selection if using the context menu
    if (angular.element($event.srcElement).parent().attr('data-context-menu')) {
      return;
    }

    // Remove selection from all others
    for (var i = 0; i < $scope.podcasts.length; i++) {
      $scope.podcasts[i].selected = false;
    }
  };

  /**
   * Shows options for a user to share a podcast on Facebook / Twitter / Tumblr
   * @param {EVENT} e - $event
   */
  $scope.sharePodcast = function ($event) {
    var podcastId = getSelectedPodcastId();
  };

  /**
   * Opens up the podcast homepage in their browser
   * @param {EVENT} e - $event
   */
  $scope.openPodcastWebpage = function ($event) {
    var podcastId = getSelectedPodcastId();
  };

  /**
   * Downloads all the un-heard podcasts
   * @param {EVENT} e - $event
   */
  $scope.downloadAllPodcasts = function ($event) {
    var podcastId = getSelectedPodcastId();
  };

  /**
   * Removes the podcast from the list, after a confirmation
   * @param {EVENT} e - $event
   */
  $scope.deletePodcast = function ($event) {
    var podcastId = getSelectedPodcastId();

    var confirm = $mdDialog.confirm().title('Remove podcast "' + $scope.podcasts[podcastId].meta.title + '"?').ariaLabel('Remove podcast').targetEvent($event).ok('Remove').cancel('Cancel');

    $mdDialog.show(confirm).then(function () {
      console.log('You chose to delete!');
    });
  };

  $document.on('click', function ($event) {
    $scope.handlePodcastUnselect($event);
  });

  function getSelectedPodcastId() {
    var podcastId = null;

    for (var i = 0; i < $scope.podcasts.length; i++) {
      if ($scope.podcasts[i].selected) {
        podcastId = i;
        break;
      }
    }

    return podcastId;
  }
  function loadPodcastSearchResults(podcastName, deferred) {
    Zeus.searchPodcastOnITunes(podcastName, function (error, result) {
      if (error) {
        throw error;
      }

      console.log(result.results);
      deferred.resolve(result.results);
    });
  }
}

angular.module('zeus').controller('MainCtrl', MainCtrl);

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

angular.module('zeus').controller('PlayerPageCtrl', PlayerPageCtrl);

/* @ngInject */
function PlayerPageCtrl($scope, $rootScope, $state, $location, $interval, $timeout, hotkeys, ngAudio) {
  $scope.showNotes = false;
  $scope.alreadyCanPlayed = false;
  $scope.podcast = $rootScope.podcasts[$state.params.podcast];
  $scope.episode = $rootScope.podcasts[$state.params.podcast].podcasts[$state.params.episode];
  $scope.episode.playbackURL = "../../userdata/podcasts/" + $scope.episode.hash + ".mp3";

  $rootScope.nowPlaying.playing = true;
  $rootScope.nowPlaying.podcastId = $state.params.podcast;
  $rootScope.nowPlaying.episodeId = $state.params.episode;

  var updateInterval = null;

  // Load sound
  $scope.sound = ngAudio.load($scope.episode.playbackURL);

  // Declare our main playback object
  $scope.playback = {
    currentlyPlaying: false,
    hoverTime: '0:00:00',
    tooltipLeft: 0,
    tooltipTop: 0,
    showHoverPosition: false,
    progress: 0,
    volume: $rootScope.settings.volume,
    lastEpisode: function lastEpisode() {
      location.assign("#/play/" + $state.params.podcast + "/" + (parseInt($state.params.episode) + 1));
      $scope.sound.pause();
    },
    replay10Seconds: function replay10Seconds() {
      $scope.sound.currentTime -= 10;
    },
    playPodcast: function playPodcast() {
      $scope.playback.currentlyPlaying = true;
      $scope.sound.play();

      // Every 30 seconds, update the current time
      updateInterval = $interval(function () {
        $scope.episode.currentTime = $scope.sound.currentTime;
        Zeus.updateSavedPodcast($scope.podcast);
      }, 1000 * 30);
    },
    pausePodcast: function pausePodcast() {
      $scope.playback.currentlyPlaying = false;
      $scope.sound.pause();

      if (angular.isDefined(updateInterval)) {
        $interval.cancel(updateInterval);
        updateInterval = undefined;
      }
    },
    forward30Seconds: function forward30Seconds() {
      $scope.sound.currentTime += 30;
    },
    nextEpisode: function nextEpisode() {
      location.assign("#/play/" + $state.params.podcast + "/" + (parseInt($state.params.episode) - 1));
      $scope.sound.pause();
    },
    goToPosition: function goToPosition($event) {
      var totalWidth = document.getElementsByTagName('md-progress-linear')[0].clientWidth;
      var clickedAt = $event.offsetX;

      var percent = (clickedAt / totalWidth).round(4);
      $scope.sound.currentTime = Math.round(($scope.sound.remaining + $scope.sound.currentTime) * percent);
    },
    showPosition: function showPosition($event) {
      var totalWidth = document.getElementsByTagName('md-progress-linear')[0].clientWidth;
      var clickedAt = $event.offsetX;

      var percent = (clickedAt / totalWidth).round(4);
      $scope.playback.hoverTime = parseTime(Math.floor(($scope.sound.remaining + $scope.sound.currentTime) * percent));

      $scope.playback.tooltipLeft = $event.pageX - 28 + 'px';
      $scope.playback.tooltipTop = angular.element(document.querySelector('md-progress-linear')).prop('offsetTop') - 23 + 'px';
      $scope.playback.showHoverPosition = true;
    }
  };

  // Because ng-bind-html-template hates me.
  angular.element(document.querySelector('[data-bind="episode.description"]')).html($scope.episode.description);

  $scope.sound.volume = $scope.playback.volume / 100; // Set initial volume

  // Register our hotkeys, j -> l. (Apparently old video managers use these keys?)
  hotkeys.bindTo($scope).add({
    combo: 'j',
    description: 'Rewinds the podcast 10 seconds',
    callback: function callback($event, hotkey) {
      $event.preventDefault();

      // Go backward 10 seconds
      $scope.playback.replay10Seconds();
    }
  }).add({
    combo: 'k',
    description: 'Pauses the currently playing podcast',
    callback: function callback($event, hotkey) {
      $event.preventDefault();

      // Toggle the podcast
      $scope.playback.currentlyPlaying ? $scope.playback.pausePodcast() : $scope.playback.playPodcast();
    }
  }).add({
    combo: 'l',
    description: 'Skips forward 30 seconds',
    callback: function callback($event, hotkey) {
      $event.preventDefault();

      // Go forward 30 seconds
      $scope.playback.forward30Seconds();
    }
  });

  $scope.$watch('playback.volume', function () {
    // Watch for changes, so we can set the volume
    $scope.sound.volume = $scope.playback.volume / 100;
  });

  $scope.$watch('sound.canPlay', function () {
    // This gets called TWICE, even though it should only be called once. So we have a temp variable to make sure we only run this once
    if ($scope.alreadyCanPlayed) {
      return;
    }

    $scope.alreadyCanPlayed = true;

    // For some reason, we get a "currently in digest" error if we click immediately. So wait partially.
    $timeout(function () {
      $scope.sound.currentTime = $scope.episode.currentTime || 0; // Load saved time
      document.querySelector('span[ng-click="playback.playPodcast()"]').click();
    }, 100);
  });

  $rootScope.$on('$stateChangeStart', function ($event, toState, toParams, fromState, fromParams) {
    $scope.playback.pausePodcast();
    $scope.sound = undefined;
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
    minutes = Math.floor((totalSec - hours * 3600) / 60);
    seconds = totalSec - (minutes * 60 + hours * 3600);
    if (hours.toString().length == 1) {
      hours = '0' + Math.floor(totalSec / 3600).toString();
    }
    if (minutes.toString().length == 1) {
      minutes = '0' + Math.floor((totalSec - hours * 3600) / 60).toString();
    }
    if (seconds.toString().length == 1) {
      seconds = '0' + (totalSec - (minutes * 60 + hours * 3600)).toString();
    }
    output = hours + ':' + minutes + ':' + seconds;
  } else if (totalSec > 59) {
    minutes = Math.floor(totalSec / 60);
    seconds = totalSec - minutes * 60;
    if (minutes.toString().length == 1) {
      minutes = '0' + Math.floor(totalSec / 60).toString();
    }
    if (seconds.toString().length == 1) {
      seconds = '0' + (totalSec - minutes * 60).toString();
    }
    output = minutes + ':' + seconds;
  } else {
    seconds = totalSec;
    if (seconds.toString().length == 1) {
      seconds = '0' + totalSec.toString();
    }

    output = (totalSec < 10 ? '00:0' : '00:') + totalSec;
  }

  return output;
}

angular.module('zeus').controller('PodcastPageCtrl', PodcastPageCtrl);

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

angular.module('zeus').controller('SettingPageCtrl', SettingPageCtrl);

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
