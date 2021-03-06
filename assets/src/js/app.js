var zeus = angular.module('zeus', [
  'ui.router',
  'ngAudio',
  'ngAnimate',
  'ngMaterial',
  'ngContextMenu',
  'ngSanitize',
  'cfp.hotkeys'
])
  .config(routeConfig)
  .config(function (hotkeysProvider) {
    /* @ngInject */
    hotkeysProvider.includeCheatSheet = false;
  });

angular
  .module('zeus')
  .directive('podcastPanel', PodcastPanelDirective)
  .directive('preloader', PreloaderDirective)
  .directive('preloaderSmall', PreloaderSmallDirective)
  .directive('preloaderSmallBlue', PreloaderSmallBlueDirective)
  .directive('podcastEpisode', PodcastEpisodeDirective)
  .directive('ngRightClick', ngRightClick);

Number.prototype.round = function (p) {
  p = p || 10;
  return parseFloat(this.toFixed(p));
};
