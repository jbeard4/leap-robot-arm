var Leap = require('leapjs');
var OWIRobotArm = require('owi-robot-arm');
var arm = new OWIRobotArm();


var previousTime = null;
var timeout;
Leap.loop({
  hand: function(hand){

    //kill switch
    clearTimeout(timeout); 
    timeout = setTimeout(function(){
      arm.stop();
    },100);

    var currentTime = new Date();

    var finalBuffer;
    if(hand.type === 'right'){

      var normalX = Math.round(hand.palmNormal[0]);
      var normalY = Math.round(hand.palmNormal[1]);
      var normalZ = Math.round(hand.palmNormal[2]);


      /*
      console.log(
        normalX,
        normalY,
        normalZ
      );
      */

      //console.log(normalX, normalY, normalZ);
     
      if(normalX === -1){
        //palm left -> gripper
        finalBuffer = controlGrips(hand, currentTime);
      }else if(normalX === 0 && normalY === -1 && normalZ === 0){
        //palm down
        finalBuffer = controlWrist(hand, currentTime);
      }else if(normalX === 0 && normalY === 1 && normalZ === 0){
        //palm up
        finalBuffer = controlElbow(hand, currentTime);
      }else if(normalX === 0 && normalY === 0 && normalZ === -1){
        //palm front
        finalBuffer = controlShoulder(hand, currentTime);
      }else{
        //continue
      }
    }else if(hand.type === 'left'){
      finalBuffer = controlBase(hand, currentTime);
    }else{
      throw new Error('Unexpected hand type!');
    }

    //console.log('finalBuffer',finalBuffer); 
    if(finalBuffer) arm.sendCommand(finalBuffer);

    previousTime = currentTime;
  }
});

var previousPitch = null;
function controlWrist(hand, currentTime){
    var toReturn = arm.commands.cmdStop;
    var pitch  = hand.pitch();

    if(previousPitch !== undefined && previousTime){
      var dx = previousPitch - pitch;
      var dt = currentTime - previousTime;

      dx = Math.floor(dx*1000) * -1;

      if(dx > 1){
        toReturn = arm.commands.cmdWristUp;
      }else if(dx < -1){
        toReturn = arm.commands.cmdWristDown;
      }else if(dx === 0){
        toReturn = arm.commands.cmdStop;
      }
    }

    previousPitch = pitch;
    return toReturn;
}


var previousDistance = null;
var window = [];
function controlGrips(hand, currentTime){
  var toReturn = arm.commands.cmdStop;
  var thumbPosition = hand.fingers[0].dipPosition;
  var pointerPosition = hand.fingers[1].dipPosition;
  var absoluteDistance = Math.sqrt(
    Math.pow(pointerPosition[0] - thumbPosition[0], 2) +
    Math.pow(pointerPosition[1] - thumbPosition[1], 2) +
    Math.pow(pointerPosition[2] - thumbPosition[2], 2)
  );

  var currentTime = new Date();
  if(previousDistance  !== undefined && previousTime){
    var dx = previousDistance - absoluteDistance;
    var dt = currentTime - previousTime;


    dx = Math.floor(dx * 10) * -1;
    //console.log('dx',dx);
    //start the robot
    if(dx >= 2 && dx <= 10){
      toReturn = arm.commands.cmdGripsOpen;
    }else if(dx <= -2 && dx >= -10){
      toReturn = arm.commands.cmdGripsClose;
    }else if(dx === 0){
      toReturn = arm.commands.cmdStop;
    }
  }

  previousDistance = absoluteDistance;
  return toReturn;
}


var previousPalmPosition;
function controlElbow(hand, currentTime){
    var toReturn = arm.commands.cmdStop;
    var palmPosition  = hand.palmPosition[1];

    if(previousPalmPosition !== undefined  && previousTime){
      var dx = previousPalmPosition - palmPosition;
      var dt = currentTime - previousTime;

      dx = Math.floor(dx * 10) * -1;
      //console.log('dx',dx);
      if(dx > 1){
        //console.log('elbow up');
        toReturn = arm.commands.cmdElbowUp;
      }else if(dx < -1){
        //console.log('elbow down');
        toReturn = arm.commands.cmdElbowDown;
      }else if(dx === 0){
        //console.log('elbow stop');
        toReturn = arm.commands.cmdStop; 
      }
    }

    previousPalmPosition = palmPosition;
    return toReturn;
}


var previousPalmPosition2;
function controlShoulder(hand, currentTime){
  var toReturn = arm.commands.cmdStop;
  var palmPosition  = hand.palmPosition[2];

  if(previousPalmPosition2 !== undefined  && previousTime){
    var dx = previousPalmPosition2 - palmPosition;
    var dt = currentTime - previousTime;

    dx = Math.floor(dx * 10) * -1;
    //console.log('dx',dx);
    if(dx > 1){
      //console.log('shoulder up');
      toReturn = arm.commands.cmdShoulderUp;
    }else if(dx < -1){
      //console.log('shoulder down');
      toReturn = arm.commands.cmdShoulderDown;
    }else if(dx === 0){
      //console.log('shoulder stop');
      toReturn = arm.commands.cmdStop;
    }
  }

  previousPalmPosition2 = palmPosition;
  return toReturn;
}


var previousYaw = null;
function controlBase(hand, currentTime){
    var toReturn = arm.commands.cmdStop;
    var yaw  = hand.yaw();

    if(previousYaw !== undefined  && previousTime){
      var dx = previousYaw - yaw;
      var dt = currentTime - previousTime;

      dx = Math.floor(dx*1000) * -1;
      //console.log('dx',dx);

      if(dx > 2){
        //console.log('rotate clockwise');
        toReturn = arm.commands.cmdBaseClockwise;
      }else if(dx < -2){
        //console.log('rotate counterclockwise');
        toReturn = arm.commands.cmdBaseCounterClockwise;
      }else if(dx === 0){
        //console.log('stop');
        toReturn = arm.commands.cmdStop;
      }
    }

    previousYaw = yaw;
    return toReturn;
}
