var Leap = require('leapjs');
var OWIRobotArm = require('owi-robot-arm');
var arm = new OWIRobotArm();

var previousTime = null;
var timeout;
Leap.loop({
  hand: function(hand){
    if(hand.type !== 'right') return;

    //kill switch
    clearTimeout(timeout); 
    timeout = setTimeout(function(){
      arm.stop();
    },100);

    var currentTime = new Date();

    //controlGrips(hand, currentTime);
    controlWrist(hand, currentTime);

    previousTime = currentTime;
  }

});


var previousPitch = null;
function controlWrist(hand, currentTime){
    var pitch  = hand.pitch();

    if(previousPitch && previousTime){
      var dx = previousPitch - pitch;
      var dt = currentTime - previousTime;

      dx = Math.floor(dx*1000) * -1;

      if(dx > 1){
        console.log('up');
        arm.wristUp();
      }else if(dx < -1){
        console.log('down');
        arm.wristDown();
      }else if(dx === 0){
        console.log('stop');
        arm.stop(); 
      }
    }

    previousPitch = pitch;
}


var previousDistance = null;
var window = [];
function controlGrips(hand, currentTime){
  var thumbPosition = hand.fingers[0].dipPosition;
  var pointerPosition = hand.fingers[1].dipPosition;
  var absoluteDistance = Math.sqrt(
    Math.pow(pointerPosition[0] - thumbPosition[0], 2) +
    Math.pow(pointerPosition[1] - thumbPosition[1], 2) +
    Math.pow(pointerPosition[2] - thumbPosition[2], 2)
  );
  //console.log('distance',absoluteDistance);

  var currentTime = new Date();
  if(previousDistance && previousTime){
    var dx = previousDistance - absoluteDistance;
    var dt = currentTime - previousTime;
    var velocity = dx/dt;

    window.push(velocity);

    if(window.length > 10){
      window.shift();
    }
    if(window.length === 10){
      var sum = window.reduce(function(a, b) { return a + b; });
      var avg = sum / window.length;

      var normalizedAvg = Math.floor(avg * 100) * -1;
      console.log('avgVelocity',normalizedAvg);

      //start the robot
      if(normalizedAvg >= 2 && normalizedAvg <= 10){
        arm.gripsOpen();
      }else if(normalizedAvg <= -2 && normalizedAvg >= -10){
        arm.gripsClose();
      }else if(normalizedAvg === 0){
        arm.stop();
      }
    }
  }

  previousDistance = absoluteDistance;
}
