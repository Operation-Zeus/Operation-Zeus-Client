var zeus = angular.module('zeus', [
  'ui.router',
  'ngAudio',
  'ngAnimate',
  'ngMaterial',
  'ngContextMenu'
]).config(['$stateProvider', function($stateProvider) {
  var homeState = {
    name: 'home',
    url: '/',
    templateUrl: 'partials/home.html'
  };

  var podcastState = {
    name: 'podcast',
    url: '/podcast/{id}',
    templateUrl: 'partials/podcast.html'
  };

  var settingState = {
    name: 'settings',
    url: '/settings',
    templateUrl: 'partials/settings.html'
  };

  var aboutState = {
    name: 'about',
    url: '/about',
    templateUrl: 'partials/about.html'
  };

  var playPodcastState = {
    name: 'playPodcast',
    url: '/play/{podcast}/{episode}',
    templateUrl: 'partials/player.html'
  };

  $stateProvider.state(homeState);
  $stateProvider.state(podcastState);
  $stateProvider.state(settingState);
  $stateProvider.state(aboutState);
  $stateProvider.state(playPodcastState);
  // $stateProvider.state(podcastState);
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
