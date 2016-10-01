/**
 * This is a bit of a "sudo" page. It isn't actually a separate page / $scope, but for all intents and purposes, it is.
 *
 * With this page, we are actually extending the MainCtrl $scope to include all of this, that way this page is always active even if the state changes
 * e.g: This is how we are letting people "listen" and "browse" at the same time.
 */
function PlayerPageCtrl($scope, $rootScope, $state, $interval, $timeout, hotkeys, ngAudio) {
  if (!$scope.podcastPlayer.isADifferentEpisode) {
    return; // All of this has already been declared
  }

  $scope.podcastPlayer.hasAPodcastPlaying = true;
  $scope.podcastPlayer.showNotes = false;
  $scope.podcastPlayer.alreadyCanPlayed = false;
  $scope.podcastPlayer.podcast = $rootScope.podcasts[$state.params.podcast];
  $scope.podcastPlayer.episode = $rootScope.podcasts[$state.params.podcast].podcasts[$state.params.episode];
  $scope.podcastPlayer.episode.playbackURL = `../../userdata/podcasts/${$scope.podcastPlayer.episode.hash}.mp3`;
  $scope.podcastPlayer.updateInterval = null;

  $rootScope.nowPlaying.playing = true;
  $rootScope.nowPlaying.podcastId = $state.params.podcast;
  $rootScope.nowPlaying.episodeId = $state.params.episode;

  // Load sound
  $scope.podcastPlayer.sound = ngAudio.load($scope.podcastPlayer.episode.playbackURL);

  // Declare our main playback object
  $scope.podcastPlayer.playback = {
    currentlyPlaying: false,
    hoverTime: '0:00:00',
    tooltipLeft: 0,
    tooltipTop: 0,
    showHoverPosition: false,
    progress: 0,
    volume: $rootScope.settings.volume,
    lastEpisode: function () {
      location.assign(`#/play/${$state.params.podcast}/${(parseInt($state.params.episode) + 1)}`);
      $scope.podcastPlayer.sound.pause();
    },
    replay10Seconds: function () {
      $scope.podcastPlayer.sound.currentTime -= 10;
    },
    playPodcast: function () {
      $scope.podcastPlayer.playback.currentlyPlaying = true;
      $scope.podcastPlayer.sound.play();

      // Every 30 seconds, update the current time
      $scope.podcastPlayer.updateInterval = $interval(function () {
        $scope.podcastPlayer.episode.currentTime = $scope.podcastPlayer.sound.currentTime;
        Zeus.updateSavedPodcast($scope.podcastPlayer.podcast);
      }, 1000 * 30);
    },
    pausePodcast: function () {
      $scope.podcastPlayer.playback.currentlyPlaying = false;
      $scope.podcastPlayer.sound.pause();

      if (angular.isDefined($scope.podcastPlayer.updateInterval)) {
        $interval.cancel($scope.podcastPlayer.updateInterval);
        $scope.podcastPlayer.updateInterval = undefined;
      }
    },
    forward30Seconds: function () {
      $scope.podcastPlayer.sound.currentTime += 30;
    },
    nextEpisode: function () {
      location.assign(`#/play/${$state.params.podcast}/${(parseInt($state.params.episode) -1)}`);
      $scope.podcastPlayer.sound.pause();
    },
    goToPosition: function ($event) {
      var totalWidth = document.getElementsByTagName('md-progress-linear')[0].clientWidth;
      var clickedAt = $event.offsetX;

      var percent = (clickedAt / totalWidth).round(4);
      $scope.podcastPlayer.sound.currentTime = Math.round(($scope.podcastPlayer.sound.remaining + $scope.podcastPlayer.sound.currentTime) * percent);
    },
    showPosition: function ($event) {
      var totalWidth = document.getElementsByTagName('md-progress-linear')[0].clientWidth;
      var clickedAt = $event.offsetX;

      var percent = (clickedAt / totalWidth).round(4);
      $scope.podcastPlayer.playback.hoverTime = parseTime(Math.floor(($scope.podcastPlayer.sound.remaining + $scope.podcastPlayer.sound.currentTime) * percent));

      $scope.podcastPlayer.playback.tooltipLeft = $event.pageX - 28 + 'px';
      $scope.podcastPlayer.playback.tooltipTop = angular.element(document.querySelector('md-progress-linear')).prop('offsetTop') - 23 + 'px';
      $scope.podcastPlayer.playback.showHoverPosition = true;
    }
  };

  $scope.podcastPlayer.sound.volume = $scope.podcastPlayer.playback.volume / 100; // Set initial volume

  // Register our hotkeys, j -> l. (Apparently old video managers use these keys?)
  hotkeys.bindTo($scope)
    .add({
      combo: 'j',
      description: 'Rewinds the podcast 10 seconds',
      callback: function ($event, hotkey) {
        $event.preventDefault();

        // Go backward 10 seconds
        $scope.podcastPlayer.playback.replay10Seconds();
      }
    })
    .add({
      combo: 'k',
      description: 'Pauses the currently playing podcast',
      callback: function ($event, hotkey) {
        $event.preventDefault();

        // Toggle the podcast
        $scope.podcastPlayer.playback.currentlyPlaying ? $scope.podcastPlayer.playback.pausePodcast() : $scope.podcastPlayer.playback.playPodcast();
      }
    })
    .add({
      combo: 'l',
      description: 'Skips forward 30 seconds',
      callback: function ($event, hotkey) {
        $event.preventDefault();

        // Go forward 30 seconds
        $scope.podcastPlayer.playback.forward30Seconds();
      }
    });

  $scope.$watch('podcastPlayer.playback.volume', function () { // Watch for changes, so we can set the volume
    $scope.podcastPlayer.sound.volume = $scope.podcastPlayer.playback.volume / 100;
  });

  $scope.$watch('podcastPlayer.sound.canPlay', function () {
    // This gets called TWICE, even though it should only be called once. So we have a temp variable to make sure we only run this once
    if ($scope.podcastPlayer.alreadyCanPlayed) {
      return;
    }

    $scope.podcastPlayer.alreadyCanPlayed = true;

    // For some reason, we get a "currently in digest" error if we click immediately. So wait partially.
    $timeout(function () {
      $scope.podcastPlayer.sound.currentTime = $scope.podcastPlayer.episode.currentTime || 0;  // Load saved time
      document.querySelector('span[ng-click="podcastPlayer.playback.playPodcast()"]').click();
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
