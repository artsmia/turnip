/*jshint asi: true*/

(function() {
  'use strict';

  window.app = angular.module('turnip', ['ngRoute', 'ngTouch', 'Orbicular'])
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
      var m = Math.floor(seconds/60), s = Math.floor(seconds%60),
      string = seconds ? m + ':' + ("0" + s).slice(-2) : '0:00'
      return string
    }
  })

  app.controller('turnipCtrl', function($scope, $rootScope) {
    $rootScope.pageTitle = "Take the tour with you"
  })

  app.directive('restorePurchases', function() {
    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      template: '<a href="#" id="restore" ng-click="restorePurchases()">Restore Purchases</a>',
      // controller: function($scope) {
      // },
      link: function(scope, element, attrs) {
        var sendCommand = function(command) {
          if(scope.Android) {
            eval("AndroidArtsMIA." + command + "()")
          } else if(scope.iOS) {
            window.location = "artsmia://" + command
          } else {
            console && console.info('sending command', command)
          }
        }
        scope.restorePurchases = function() {
          sendCommand('restorePurchases')
        }

        scope.Android = !(navigator.userAgent.match(/org.artsmia.android/i) == null);
        scope.iOS = !(navigator.userAgent.match(/org.artsmia.ios/i) == null);
        scope.inApp = scope.Android || scope.iOS
        if(!scope.iOS) element.remove() // TODO: throw down a paywall?
      }
    }
  })

  app.controller('tourCtrl', function($scope, $rootScope, $sce, tour) {
    $scope.tour = tour
    $scope.tour.trustedContent = $sce.trustAsHtml($scope.tour.content)
    $rootScope.pageTitle = tour.title

    $scope.tourUrl = '/matisse'
    $scope.showTour = !tour.paid || !!window.location.pathname.match($scope.tourUrl)
    $scope.inApp = navigator.userAgent.match(/org.artsmia.(\w+)/)
    var storeLink = navigator.userAgent.match(/iPhone|iPad/) ?
      'https://itunes.apple.com/us/app/minneapolis-institute-arts/id494412081' :
      'https://play.google.com/store/apps/details?id=org.artsmia.android'

    $scope.tourLink = $scope.inApp ? "/matisse-tour/#/matisse-tour" : storeLink

    // If we can't show the full tour, clip `stops` to just the first two
    if(!$scope.showTour) $scope.tour.stops = $scope.tour.stops.slice(0, 2)

    $scope.activeStop = 0
    $scope.activateStop = function(index) {
      $scope.activeStop = index
    }

    $scope.mainAndColors = function(stop) {
      var stops =  {base: stop}
      for(var color in stop.colors) { stops[color] = stop.colors[color] }
      return stops
    }

    window.$scope = $scope
    $scope.audio = angular.element('audio')[0]
    $scope.play = function(stop, scope) {
      var li = angular.element(event.target)
      if(li.hasClass('icon play')) {
        // beware, jquery
        li = $scope.playing && $scope.playing.li || li.parents('section').find('li:first')
        stop = li.scope().stop
      } else {
        while(li[0].nodeName != 'LI') li = li.parent()
      }
      var audioURL = $scope.tour.mp3_location + li.attr('data-audio')

      if($scope.playing && !$scope.audio.paused) {
        $scope.audio.pause()
        if($scope.audio.src.match(audioURL)) return
      }

      $scope.playing = {stop: stop, li: li}
      $scope.audio.src = audioURL
      $scope.audio.play()
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
      })

      $scope.isPlayingClass = function(stop, returnBoolean, checkLeaves) {
        var leafIsPlaying = false,
          returnBoolean = returnBoolean || false,
          checkLeaves = checkLeaves == undefined ? true : false
        for(var x in stop.colors || {}) {
          if(checkLeaves && $scope.playing.stop == stop.colors[x]) leafIsPlaying = true
        }

        if((leafIsPlaying || $scope.playing.stop == stop) && !$scope.audio.paused) {
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
      }
    }
  })
})()
