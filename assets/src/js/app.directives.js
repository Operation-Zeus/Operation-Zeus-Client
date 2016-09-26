function PodcastPanelDirective() {
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
