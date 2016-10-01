angular
  .module('zeus')
  .controller('PlayerPageCtrl', PlayerPageCtrl);

/* @ngInject */
function PlayerPageCtrl($scope, $rootScope, $state, $location, $interval, $timeout, hotkeys, ngAudio) {
  $scope.showNotes = false;
  $scope.alreadyCanPlayed = false;
  $scope.podcast = $rootScope.podcasts[$state.params.podcast];
  $scope.episode = $rootScope.podcasts[$state.params.podcast].podcasts[$state.params.episode];
  $scope.episode.playbackURL = '../../userdata/podcasts/' + $scope.episode.hash + '.mp3';

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

      // Every 30 seconds, update the current time
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
    goToPosition: function ($event) {
      var totalWidth = document.getElementsByTagName('md-progress-linear')[0].clientWidth;
      var clickedAt = $event.offsetX;

      var percent = (clickedAt / totalWidth).round(4);
      $scope.sound.currentTime = Math.round(($scope.sound.remaining + $scope.sound.currentTime) * percent);
    },
    showPosition: function ($event) {
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
  $scope.$watch('playback.volume', function () { // Watch for changes, so we can set the volume
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
      $scope.sound.currentTime = $scope.episode.currentTime || 0;  // Load saved time
      document.querySelector('span[ng-click="playback.playPodcast()"]').click();
    }, 100);
  });

  // Register our hotkeys, j -> l. (Apparently old video managers use these keys?)
  hotkeys.bindTo($scope)
    .add({
      combo: 'j',
      description: 'Rewinds the podcast 10 seconds',
      callback: function ($event, hotkey) {
        $event.preventDefault();

        // Go backward 10 seconds
        $scope.playback.replay10Seconds();
      }
    })
    .add({
      combo: 'k',
      description: 'Pauses the currently playing podcast',
      callback: function ($event, hotkey) {
        $event.preventDefault();

        // Toggle the podcast
        $scope.playback.currentlyPlaying ? $scope.playback.pausePodcast() : $scope.playback.playPodcast();
      }
    })
    .add({
      combo: 'l',
      description: 'Skips forward 30 seconds',
      callback: function ($event, hotkey) {
        $event.preventDefault();

        // Go forward 30 seconds
        $scope.playback.forward30Seconds();
      }
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
