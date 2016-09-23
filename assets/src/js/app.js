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
  .directive('podcastEpisode', PodcastEpisodeDirective);

Number.prototype.round = function (p) {
  p = p || 10;
  return parseFloat(this.toFixed(p));
};
