zeus.controller('HomePageCtrl', ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
  $scope.podcasts = $rootScope.podcasts;
  console.log($scope.podcasts);
  $('button.modal-trigger').leanModal();
  $('.tooltipped').tooltip({
    delay: 50
  });

  $scope.openPodcastModal = function () {
    Materialize.updateTextFields();
    $('.modal#addPodcastModal').openModal();
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
        $('.modal#addPodcastModal').closeModal();
        $scope.loadingPodcasts = false;

        $scope.$apply();

        $('.tooltipped').tooltip({
          delay: 10
        });
      }, 2000); // Give image time to download, if caching
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

  $timeout(function () {
    $('.tooltipped').tooltip({
      delay: 50
    });
  }, 500);
}]);
