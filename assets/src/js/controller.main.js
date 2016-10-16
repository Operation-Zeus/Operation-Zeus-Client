angular
  .module('zeus')
  .controller('MainCtrl', MainCtrl);

/* @ngInject */
function MainCtrl($scope, $rootScope, $window, $state, $document, $interval, $timeout, $mdToast, hotkeys, ngAudio) {
  $scope.podcastPlayer = {};
  $scope.podcastPlayer.isADifferentEpisode = true;
  $scope.podcastPlayer.onPodcastPage = false;
  $scope.podcastPlayer.podcast = {};
  $scope.podcastPlayer.episode = {};

  $scope.closeToast = function () {
    $mdToast.hide();
  };

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

  // Hook the $state changing, and if it's our podcast, lets simulate a new page
  $rootScope.$on('$stateChangeSuccess', function ($event, toState, toParams, fromState, fromParams) {
    $scope.closeToast();

    if (toState.name == 'playPodcast') {
      $scope.podcastPlayer.onPodcastPage = true;
      $scope.podcastPlayer.isADifferentEpisode = false;

      // If this is a different podcast / episode then what is currently playing -> re-declare all the variables
      if (toParams.podcast != $scope.podcastPlayer.podcast.id && toParams.episode != $scope.podcastPlayer.episode.id) {
        $scope.podcastPlayer.isADifferentEpisode = true;

        if ($scope.podcastPlayer.playback !== undefined) {
          $scope.podcastPlayer.playback.pausePodcast();
          $scope.podcastPlayer.sound = null;
        }
      }

      PlayerPageCtrl($scope, $rootScope, $state, $interval, $timeout, hotkeys, ngAudio);
      return;
    }

    $scope.podcastPlayer.onPodcastPage = false;
  });
}
