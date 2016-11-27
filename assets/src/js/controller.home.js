angular
  .module('zeus')
  .controller('HomePageCtrl', HomePageCtrl);

/* @ngInject */
function HomePageCtrl($scope, $rootScope, $timeout, $document, $q, $mdDialog, $mdToast) {
  var podcastAutocompleteTimer;
  $scope.podcasts = $rootScope.podcasts;
  $scope.podcastInfo = {};
  console.log($scope.podcasts);

  $scope.closePodcastModal = function () {
    $mdDialog.hide();
  };

  $scope.openPodcastModal = function ($event) {
    $mdDialog.show({
      parent: angular.element(document.body),
      targetEvent: $event,
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

  /**
   * Checks for new podcast / updates information if changes
   */
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

  /**
   * On right-click, select our podcast
   * @param {PODCAST} podcast - the podcast object
   * @param {EVENT} $event - the event object (from the DOM)
   */
  $scope.selectPodcast = function (podcast, $event) {
    // Unselect all other podcasts
    $scope.handlePodcastUnselect($event);

    $scope.podcasts[podcast.id].selected = true;
  };

  /**
   * This allows for a "toggle" on the podcast
   * @param {EVENT} $event - the event object
   */
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
   * @param {EVENT} $event
   */
  $scope.sharePodcast = function ($event) {
    var podcastId = getSelectedPodcastId();

    $mdDialog.show({
      parent: angular.element(document.body),
      targetEvent: $event,
      clickOutsideToClose: true,
      contentElement: '#sharePodcastModal'
    });
  };

  /**
   * Opens up the podcast homepage in their browser
   * @param {EVENT} $event
   */
  $scope.openPodcastWebpage = function ($event) {
    var podcastId = getSelectedPodcastId();

    shell.openExternal($scope.podcasts[podcastId].meta.link);
  };

  /**
   * Downloads all the un-heard podcasts
   * @param {EVENT} $event
   */
  $scope.downloadAllPodcasts = function ($event) {
    var podcastId = getSelectedPodcastId();

  };

  /**
   * Removes the podcast from the list, after a confirmation
   * @param {EVENT} $event
   */
  $scope.deletePodcast = function ($event) {
    var podcastId = getSelectedPodcastId();

    var confirm = $mdDialog.confirm()
      .title(`Remove podcast podcast "${$scope.podcasts[podcastId].meta.title}"?`)
      .ariaLabel('Remove podcast')
      .targetEvent($event)
      .ok('Remove')
      .cancel('Cancel');

    $mdDialog.show(confirm).then(function () {
      var title = $scope.podcasts[podcastId].meta.title;
      Zeus.removePodcast(podcastId);

      $mdToast.show({
        hideDelay: 3000,
        position: 'bottom left',
        template: `
        <md-toast style="max-width: 500px; bottom: 10px; left: 10px;">
          <span class="md-toast-text">Deleted podcast "${title}"</span>
          <md-button class="md-accent" ng-click="undoLastDelete($event)">
            Undo
          </md-button>
          <md-button ng-click="closeToast($event)">
            Close
          </md-button>
        </md-toast>
        `
      });
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
