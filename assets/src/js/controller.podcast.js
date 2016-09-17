zeus.controller('PodcastPageCtrl', ['$scope', '$rootScope', '$route', '$location', '$timeout', '$interval', function ($scope, $rootScope, $route, $location, $timeout, $interval) {
  $scope.podcast = $rootScope.podcasts[$route.current.params.id];
  $scope.showUnplayedOnly = true;
  if (!$scope.podcast) {
    $location.url('/');
    return;
  }

  for (var i = 0; i < $scope.podcast.podcasts.length; i++) {
    $scope.podcast.podcasts[i].downloading = false;
  }

  $scope.downloadEpisode = function (id) {
    console.log(id);
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

  $('ul.tabs').tabs();
}]);
