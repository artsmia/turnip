Android = !(navigator.userAgent.match(/org.artsmia.android/i) == null);
iOS = !(navigator.userAgent.match(/org.artsmia.ios/i) == null);

function sendCommand(command) {
  var constructedCommand = command;
  if (Android) {
    constructedCommand = "AndroidArtsMIA." + command + "()";
    eval(constructedCommand);
  } else if (iOS) {
    constructedCommand = 'artsmia://' + command;
    window.location = constructedCommand;
  } else {
    $('body').prepend("<div>Sent: " + constructedCommand);
  }
}

function showRestorePurchases() {
  console.log("Android: " + Android);
  console.log("iOS: " + iOS);
  if (Android || iOS) {
    var targetDiv = $('#restore-purchases');
    // create a link that will restore purchases in the app
    var link = $('<a>', {
      text: 'Restore Purchases',
      title: 'Restore Purchases',
      href: '#',
      click: function () {
        console.log("sending restorePurchases command");
        sendCommand('restorePurchases');
        return false;
      }
    });
    targetDiv.html(link);
    targetDiv.show();
  }
}
