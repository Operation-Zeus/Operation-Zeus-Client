/* @ngInject*/
function routeConfig($stateProvider, $locationProvider) {
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
}
