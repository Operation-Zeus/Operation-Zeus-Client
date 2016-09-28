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

    var confirm = $mdDialog.confirm()
      .title('Remove podcast "' + $scope.podcasts[podcastId].meta.title +  '"?')
      .ariaLabel('Remove podcast')
      .targetEvent($event)
      .ok('Remove')
      .cancel('Cancel');

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
}
