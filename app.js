/*jshint asi: true*/

(function() {
  'use strict';

  window.app = angular.module('turnip', ['ngRoute', 'ngTouch', 'Orbicular', 'segmentio'])
  app.config(function($routeProvider, $compileProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'turnipCtrl'
      })
      .when('/:id', {
        templateUrl: 'views/tour.html',
        controller: 'tourCtrl',
        resolve: {
          tour: function($q, $http, $route) {
            var d = $q.defer();
            $http.get('/tours/'+$route.current.params.id.replace('-tour', '')+'.json').then(function(response) {
              d.resolve(response.data)
            }, function err(reason) {
              d.reject(reason);
            });
            return d.promise;
          }
        }
      })
    // allow artsmia:// URLs
    // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|mailto|tel|artsmia):/);
  })

  app.filter('secondsToTime', function() {
    return function(seconds, args) {
      if(!seconds) return
      var m = Math.floor(seconds/60), s = Math.floor(seconds%60),
      string = seconds ? m + ':' + ("0" + s).slice(-2) : '0:00'
      return string
    }
  })

  app.controller('turnipCtrl', function($scope, $rootScope, segmentio) {
    $rootScope.pageTitle = "Take the tour with you"
    window.analytics.page('Audio Tours Home', {})
  })

  app.directive('restorePurchases', function() {
    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      template: '<a href="#" id="restore" ng-click="restorePurchases($event)">Restore Purchases</a>',
      link: function(scope, element, attrs) {
        scope.restorePurchases = function(event) {
          event.preventDefault()
          window.location = "artsmia://restorePurchases"
        }

        scope.iOS = !(navigator.userAgent.match(/org.artsmia.ios/i) == null);
        if(!scope.iOS) element.remove()
      }
    }
  })

  app.controller('tourCtrl', function($scope, $rootScope, $sce, tour, segmentio) {
    $scope.tour = tour
    $scope.tour.trustedContent = $sce.trustAsHtml($scope.tour.content)
    $rootScope.pageTitle = tour.title

    $scope.tourUrl = '/matisse'
    $scope.showTour = !tour.paid || !!window.location.pathname.match($scope.tourUrl)
    $scope.inApp = navigator.userAgent.match(/org.artsmia.(\w+)/)
    var storeLink = navigator.userAgent.match(/iPhone|iPad/) &&
      'https://itunes.apple.com/us/app/minneapolis-institute-arts/id494412081' ||
      navigator.userAgent.match(/Android/) &&
      'https://play.google.com/store/apps/details?id=org.artsmia.android' || ''

    $scope.tourLink = $scope.inApp ? "/matisse-tour/#/matisse-tour" : storeLink
    $scope.openAppOrStore = function(event) {
      if(!$scope.inApp && navigator.userAgent.match(/iPhone|iPad/)) {
        event.preventDefault()
        window.location = 'artsmia://audio';
        setTimeout(function() { window.location = storeLink }, 10)
      }
    }

    // If we can't show the full tour, clip `stops` to just the first two
    if(!$scope.showTour) $scope.tour.stops = $scope.tour.stops.slice(0, 2)

    window.analytics.page(tour.title, {inApp: $scope.inApp, showFullTour: $scope.showTour})

    $scope.activeStop = 0
    $scope.activateStop = function(index, stop) {
      if($scope.activeStop != index) {
        $scope.activeStop = index
        segmentio.track('Opened stop', {label: index+1 +' - '+stop.name, category: $scope.tour.title})
      }
    }

    $scope.mainAndColors = function(stop) {
      var stops =  {base: stop}
      for(var color in stop.colors) { stops[color] = stop.colors[color] }
      return stops
    }

    window.$scope = $scope
    $scope.audio = angular.element('audio')[0]
    $scope.play = function(stop, event) {
      var li = angular.element(event.target)
      if(li.hasClass('icon play')) {
        // beware, jquery
        li = $scope.playing && $scope.playing.li || li.parents('section').find('li:first')
        stop = li.scope().stop
      } else {
        while(li[0].nodeName != 'LI') li = li.parent()
      }
      var audioURL = $scope.tour.mp3_location + li.attr('data-audio'),
          stopIdForAnalytics = stop.file + ' - ' + stop.name

      $scope.lastPlayedStop = stop

      if($scope.playing && !$scope.audio.paused) {
        $scope.audio.pause()
        if($scope.audio.src.match(audioURL))
          return segmentio.track('Paused', {label: stopIdForAnalytics, category: $scope.tour.title})
      }

      if($scope.playing && $scope.lastPlayedStop && $scope.audio.src.split('/').slice(-1)[0] != li.attr('data-audio')) {
        // abandoning one track for another
        segmentio.track('Abandoned', {
          label: $scope.lastPlayedStop.file+' - '+$scope.lastPlayedStop.name,
          value: Math.floor($scope.audio.currentTime),
          category: $scope.tour.title
        })
      }

      $scope.playing = {stop: stop, li: li}
      if(!$scope.audio.src.match(audioURL)) $scope.audio.src = audioURL
      $scope.audio.play()
      segmentio.track('Playing', {label: stopIdForAnalytics, category: $scope.tour.title})
      $scope.audio.addEventListener('timeupdate', function(event) {
        var audio = $scope.audio
        $scope.playing.li.scope().info = $scope.playing.info = {
          time: audio.currentTime,
          duration: audio.duration,
          percentDone: audio.currentTime / audio.duration
        }
        $scope.$apply()
      })

      $scope.audio.addEventListener('ended', function(event) {
        $scope.playing.info = {time: 0}
        segmentio.track('Finished', {label: stopIdForAnalytics, noninteraction: true, category: $scope.tour.title})
      })

      $scope.isPlayingClass = function(stop, returnBoolean, checkLeaves) {
        var leafIsPlaying = false,
          returnBoolean = returnBoolean || false,
          checkLeaves = checkLeaves == undefined ? true : false
        for(var x in stop.colors || {}) {
          if(checkLeaves && $scope.playing.stop == stop.colors[x]) leafIsPlaying = true
        }

        if((leafIsPlaying || $scope.playing.stop == stop)) {
          var _return = returnBoolean ? true : 'playing'
          return _return
        } else {
          return false
        }
      }

      $scope.resume = function() {
        if(!$scope.playing) return
        var audio = $scope.audio
        audio.paused ? audio.play() : audio.pause()
      }

      $scope.restart = function() {
        $scope.audio.currentTime = 0
      }
      $scope.scrub = function(delta) {
        $scope.audio.currentTime += delta
        segmentio.track('Scrubbed track', {label: stopIdForAnalytics, value: delta, category: $scope.tour.title})
      }
    }

    if(!$scope.tourLink) {
      setTimeout(function() {
        segmentio.trackLink($('#app-store'), 'Clicked App Store Link')
        segmentio.trackLink($('#android-store'), 'Clicked Android Store Link')
      }, 1000)
    }
  })
})()
