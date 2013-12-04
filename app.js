/*jshint asi: true*/

(function() {
  'use strict';

  window.app = angular.module('turnip', ['Orbicular'])
 
  app.filter('secondsToTime', function() {
    return function(seconds, args) {
      var m = Math.floor(seconds/60), s = Math.floor(seconds%60),
      string = seconds ? m + ':' + ("0" + s).slice(-2) : '0:00'
      return string
    }
  })

  app.controller('turnipCtrl', function($scope) {
    $scope.tourUrl = '/audacious-eye-tour'
    $scope.showTour = !!window.location.pathname.match($scope.tourUrl)
    $scope.inApp = navigator.userAgent.match(/org.artsmia.(\w+)/)
    var storeLink = navigator.userAgent.match(/iPhone|iPad/) ?
      'https://itunes.apple.com/us/app/minneapolis-institute-arts/id494412081' :
      'https://play.google.com/store/apps/details?id=org.artsmia.android'

    $scope.tourLink = $scope.inApp ? "/audacious-eye-tour/" : storeLink
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

  app.controller('tourCtrl', function($scope) {
    window.$scope = $scope

    $scope.activeStop = 0
    $scope.activateStop = function(index) {
      $scope.activeStop = index
    }

    $scope.mainAndColors = function(stop) {
      var stops =  {base: stop}
      for(var color in stop.colors) { stops[color] = stop.colors[color] }
      return stops
    }

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
      var audioURL = li.attr('src')

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

    $scope.stops = [{"id": 0, "file": "000", "name": "Introduction and Welcome", "more": "Welcome and introduction by Kaywin Feldman, Director & President, MIA and Matthew Welch, Deputy Director, MIA  - 0", "speaker": "Kaywin Feldman, Director & President, MIA and Matthew Welch, Deputy Director, MIA", "length": "4:41"}, {"id": 1, "file": "001", "name": "Daiitoku Myōō", "accession": "1982.002", "speaker": "Andreas Marks", "length": "1:57", "colors": {"green": {"file": "001g", "name": "How was it made?", "speaker": "Andreas Marks", "length": ":55"}, "red": {"file": "001r", "name": "Wisdom King of All Inspiring Power", "speaker": "Andreas Marks", "length": "1:23"}, "yellow": {"file": "001y", "name": "Restoration of the sculpture", "speaker": "Andreas Marks", "length": "1:00"}}}, {"id": 2, "file": "002", "name": "Descent of Jizō Bosatsu", "accession": "1992.001.CF", "more": "Descent of Jizō Bosatsu; 14th cent., first half;", "speaker": "Pat Graham", "length": "1:23", "colors": {"green": {"file": "002G", "name": "Who is Jizō?", "speaker": "Pat Graham", "length": "2:10"}, "red": {"file": "002R", "name": "Luxurious materials", "speaker": "Pat Graham", "length": "1:59"}, "yellow": {"file": "002Y", "name": "The basics of Buddhism", "speaker": "Pat Graham", "length": "1:56"}}}, {"id": 3, "file": "003", "name": "Birds in Landscape", "accession": "1996.001a-b", "more": "Shūgetsu Tōkan; Birds in Landscape; 16th cent., early", "speaker": "Bill Clark", "length": "3:27", "colors": {"green": {"file": "003G", "name": "Appreciating Japanese screens", "speaker": "Bill Clark", "length": "1:05"}, "red": {"file": "003R", "name": "“Reading” Japanese screens", "speaker": "Bill Clark", "length": ":53"}, "yellow": {"file": "003Y", "name": "Display and function of Japanese screens", "speaker": "Bill Clark", "length": ":55"}}}, {"id": 4, "file": "004", "name": "Scenes from the Tale of Genji in the Four Seasons", "accession": "1995.012a-b", "speaker": "Andreas Marks", "length": "2:11", "colors": {"green": {"file": "004G", "name": "A party game", "speaker": "Andreas Marks", "length": "2:08"}, "red": {"file": "004R", "name": "Chapters from an epic tale", "speaker": "Andreas Marks", "length": "2:49"}, "yellow": {"file": "004Y", "name": "Recalling earlier architecture and fashion", "speaker": "Andreas Marks", "length": ":56"}}}, {"id": 5, "file": "005", "name": "Hawk and Egret", "accession": "1978.003.CF; Ōhara Keizan;", "speaker": "Bill Clark", "length": "2:12", "colors": {"green": {"file": "005G", "name": "Advice for the budding collector", "speaker": "Bill Clark", "length": "1:20"}, "red": {"file": "005R", "name": "The thrill of the hunt for art", "speaker": "Bill Clark", "length": "1:19"}}}, {"id": 6, "file": "006", "name": "Three Friends of Winter", "accession": "1988.002a-b.CF; Yamamoto Baiitsu; Three Friends of Winter", "speaker": "Pat Graham", "length": "2:05", "colors": {"green": {"file": "006G", "name": "An artist’s imagination", "speaker": "Pat Graham", "length": "2:49"}, "red": {"file": "006R", "name": "Composing a screen", "speaker": "Pat Graham", "length": "2:09"}, "yellow": {"file": "006Y", "name": "A screen for every season", "speaker": "Pat Graham", "length": ":49"}}}, {"id": 7, "file": "007", "name": "Lady Tokiwa Fleeing", "accession": "2001.015 UtagawaKunitsugu", "speaker": "Andreas Marks", "length": ":59", "colors": {"green": {"file": "007G", "name": "An action-packed scene", "speaker": "Andreas Marks", "length": "1:11"}, "red": {"file": "007R", "name": "Publishing woodblock prints", "speaker": "Andreas Marks", "length": "1:59"}, "yellow": {"file": "007Y", "name": "How these artworks came into the Clark Collection", "speaker": "Andreas Marks", "length": "2:24"}}}, {"id": 8, "file": "008", "name": "Shōki and Demons", "accession": "1994.002.L.CF, Aoki Toshio, late 19th cent.,", "speaker": "Chelsea Foxwell", "length": "2:03", "colors": {"green": {"file": "008G", "name": "A painting as a window", "speaker": "Chelsea Foxwell", "length": "1:35"}, "red": {"file": "008R", "name": "Lovable ghosts and demons", "speaker": "Chelsea Foxwell", "length": "2:00"}, "yellow": {"file": "008Y", "name": "Profile of the artist", "speaker": "Chelsea Foxwell", "length": "1:40"}}}, {"id": 9, "file": "009", "name": "Eagle Threatening Monkeys", "accession": "2001.016.L, Kanō Hōgai, second half 19th cent.,", "speaker": "Chelsea Foxwell", "length": "1:48", "colors": {"green": {"file": "009G", "name": "Eerie and unsettling tone", "speaker": "Chelsea Foxwell", "length": "1:25"}, "red": {"file": "009R", "name": "Creating an illusion of space", "speaker": "Chelsea Foxwell", "length": "1:15"}, "yellow": {"file": "009Y", "name": "Powerful brushwork", "speaker": "Chelsea Foxwell", "length": "1:24"}}}, {"id": 10, "file": "010", "name": "Bamboo flower basket", "accession": "1997.050.CF; Iizuka, 1927-1934 (ALB7)", "speaker": "Robert Coffman", "length": "3:07", "colors": {"green": {"file": "010G", "name": "The artist’s education", "speaker": "Robert Coffman", "length": "1:47"}, "red": {"file": "010R", "name": "Properties of bamboo", "speaker": "Robert Coffman", "length": ":57"}}}, {"id": 11, "file": "011", "name": "Landscape", "accession": '', "speaker": "Rhiannon Paget", "length": ":57", "colors": {"green": {"file": "011G", "name": "Chinese prototype", "speaker": "Rhiannon Paget", "length": "1:48"}, "red": {"file": "011R", "name": "A legendary poem", "speaker": "Rhiannon Paget", "length": "2:28"}, "yellow": {"file": "011Y", "name": "What is literati painting?", "speaker": "Rhiannon Paget", "length": "1:50"}}}, {"id": 12, "file": "012", "name": "Mobile", "accession": "2006.023.CF; Uematsu Chikuyū", "speaker": "Bill Clark", "length": "2:37", "colors": {"green": {"file": "012G", "name": "Innovation in bamboo", "speaker": "Bill Clark", "length": ":53"}}}, {"id": 13, "file": "013", "name": "Rise", "accession": "2006.031a-b.CF; Fukami Sueharu", "speaker": "Bill Clark", "length": "2:10", "colors": {"green": {"file": "013G", "name": "The artist’s process", "speaker": "Bill Clark", "length": "2:01"}, "red": {"file": "013R", "name": "The collector’s story & concluding remarks by Kaywin Feldman", "speaker": "Bill Clark and Kaywin Feldman", "length": "2:14/1:20"}}}]
    $scope.mp3_location = '//cdn.dx.artsmia.org/audio-tours/audacious-eye/'
  })
})()
