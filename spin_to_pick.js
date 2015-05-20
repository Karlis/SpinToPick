/*
03.11.2013
Karlis Lukstins
Spin to pick wheel
*/

"use strict";
var SpinToPick = function (options) {
  var stp = this;

  stp.config = {
    colors : ["#ECD078", "#D95B43", "#C02942", "#54A4E7", "#53777A"],
    choice : ["Party", "Study", "Work", "Exercise", "Sleep"],
    canvas: null, //Default canvas id
    center : 320,
    radius : 300,
    text_radius : 200,
    spinAngleSum : 90,
    startAngle: 0,
    sound_file: "tick.wav",
    callback_path: "/wheel",
    tick_buffer: null,
    mute: false,
    show_arrow: true
  };

  if (options) {
    for (var prop in options) {
      stp.config[prop] = options[prop];
    }
  }

  stp.toggle_mute = function () {
    if (stp.config.mute) {
      stp.config.mute = false;
    } else {
      stp.config.mute = true;
    }
  };

  stp.initAudio = function () {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;

    if (window.AudioContext) {
      stp.audio_ctx = new AudioContext();

      var request = new XMLHttpRequest();
      request.open('GET', stp.config.sound_file, true);
      request.responseType = 'arraybuffer';

      // Decode asynchronously
      request.onload = function () {
        stp.audio_ctx.decodeAudioData(request.response, function (buffer) {
          stp.config.tick_buffer = buffer;
        });
      }
      request.send();

      stp.web_audio = true;
    } else {
      var sound = document.createElement('audio');
      sound.setAttribute('src', stp.config.sound_file);
      stp.sound = sound;
      stp.web_audio = false;
    }
  };

  function play_tick () {
    var source = stp.audio_ctx.createBufferSource(); // creates a sound source
    source.buffer = stp.config.tick_buffer;                    // tell the source which sound to play
    source.connect(stp.audio_ctx.destination);       // connect the source to the context's destination (the speakers)
    source.start(0);                           // play the source now
  };

  stp.draw = function () {
    stp.drawRouletteWheel();
    stp.initAudio();
  };

  stp.drawRouletteWheel = function () {
    var canvas = stp.config.canvas;

    if (canvas.getContext) {
      var w_radius = this.config.radius;
      var w_center = this.config.center;
      var textRadius = this.config.text_radius;
      stp.arc = Math.PI * (2/stp.config.choice.length)

      stp.ctx = canvas.getContext("2d");
      stp.ctx.clearRect(0,0,500,500);

      stp.ctx.strokeStyle = "black";
      stp.ctx.lineWidth = 2;

      stp.ctx.font = 'bold 45px sans-serif';

      for(var i = 0; i < stp.config.choice.length; i++) {

        var angle = stp.config.startAngle + i * stp.arc;
        stp.ctx.fillStyle = stp.config.colors[i];

        stp.ctx.beginPath();
        stp.ctx.moveTo(w_center,w_center);
        stp.ctx.arc(w_center,w_center,w_radius,angle,angle+stp.arc,false);
        stp.ctx.lineTo(w_center,w_center);
        stp.ctx.fill();

        stp.ctx.save();
        stp.ctx.fillStyle = "#EEE";
        stp.ctx.translate(w_center + Math.cos(angle + stp.arc / 2) * textRadius, w_center + Math.sin(angle + stp.arc / 2) * textRadius);
        stp.ctx.rotate(angle + stp.arc / 2 + Math.PI / 2);
        var text = stp.config.choice[i];
        stp.ctx.shadowColor = "black";
        stp.ctx.shadowOffsetX = 0;
        stp.ctx.shadowOffsetY = 0;
        stp.ctx.shadowBlur = 10;
        stp.ctx.fillText(text, -stp.ctx.measureText(text).width / 2, 0);
        stp.ctx.restore();
      }

      //Arrow
      if (stp.config.show_arrow) {
        stp.ctx.fillStyle = "white";
        stp.ctx.strokeStyle = "black";
        stp.ctx.beginPath();
        stp.ctx.moveTo(w_center - 8, 0);
        stp.ctx.lineTo(w_center + 8, 0);
        stp.ctx.lineTo(w_center + 8, 10);
        stp.ctx.lineTo(w_center + 19, 10);
        stp.ctx.lineTo(w_center + 0, 30);
        stp.ctx.lineTo(w_center - 19, 10);
        stp.ctx.lineTo(w_center - 8, 10);
        stp.ctx.lineTo(w_center - 8, 0 );
        stp.ctx.fill();
        stp.ctx.stroke();
      }
    }
  };

  stp.spin = function () {
    window.cancelAnimationFrame(stp.spinTimeout);
    stp.spinAngleStart = Math.random() * 15 + 30;
    stp.spinTime = 0;
    stp.spinTimeTotal = ( Math.random() + 1)  * 5000;
    stp.spinTimeout = window.requestAnimFrame(animLoop);
  };

  stp.remoteSpin = function (remoteSpinAngleStart, remoteSpinTimeTotal) {
    window.cancelAnimationFrame(stp.spinTimeout);
    stp.spinAngleStart = remoteSpinAngleStart;
    stp.spinTime = 0;
    stp.spinTimeTotal = remoteSpinTimeTotal;
    stp.spinTimeout = window.requestAnimFrame(animLoop);
  };

  function animLoop () {
    stp.spinTime += 30;
    if(stp.spinTime >= stp.spinTimeTotal) {
      stp.stopRotateWheel();
            return;
    }
    var spinAngle = stp.spinAngleStart - easeOut(stp.spinTime, 0, stp.spinAngleStart, stp.spinTimeTotal);
    stp.config.startAngle += (spinAngle * Math.PI / 180);
    stp.drawRouletteWheel();

    stp.config.spinAngleSum += spinAngle;
    var ticks = stp.config.spinAngleSum / (360/stp.config.choice.length);

    if (ticks > 1) {
      stp.config.spinAngleSum -= Math.floor(ticks) * (360/stp.config.choice.length);

      if (!stp.config.mute) {
        if (stp.web_audio) {
          play_tick();
        } else {
          sound.play();
        }
      }
    }
    requestAnimFrame(animLoop);
  };

  stp.stopRotateWheel = function () {
    window.cancelAnimationFrame(stp.spinTimeout);

    var degrees = stp.config.startAngle * 180 / Math.PI + 90;
    var arcd = stp.arc * 180 / Math.PI;
    var index = Math.floor((360 - degrees % 360) / arcd);

    Spt_insert(index);
    //var text = stp.config.choice[index]
    //console.log(text);
  };

  function easeOut(t, b, c, d) {
    var ts = (t/=d)*t;
    var tc = ts*t;
    return b+c*(tc + -3*ts + 3*t);
  };

  return stp;
}

function setup_wheel (params, spinable, show_title) {
  var div = document.createElement('div');
  div.setAttribute('class',"wheel");

  if (show_title != false) {
    var title = document.createElement('h1');
    title.textContent = params[0];
    div.appendChild(title);
  }

  var canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 640;
  div.appendChild(canvas);

  var br = document.createElement('br');
  div.appendChild(br);

  if (spinable != false) {
    var btn = document.createElement('button');
    btn.setAttribute('class',"btn");
    btn.setAttribute('class',"btn btn-primary");
    btn.innerHTML = "Spin to pick";
    div.appendChild(btn);
  }

  document.getElementById('cart').appendChild(div);

  var options = {
    canvas: canvas
  };
  if (params[1]) options["choice"] = params[1];
  if (params[2]) options["colors"] = params[2];

  if (show_title == false) {
    options["show_arrow"] = false;
  }

  var wheel = new SpinToPick(options);
  wheel.draw();

  // Add events
  if (spinable != false) {
    btn.onclick = wheel.spin;
    var hammertime = Hammer(canvas, {
        prevent_default: true,
        swipe_velocity: 0.2
    }).on("swipe", function (event) {
      event.gesture.preventDefault();
      var g = event.gesture;

      var rotate_speed = g.velocityX + g.velocityY + 0.3;
      wheel.remoteSpin(30*(rotate_speed),5000 * (rotate_speed));
      // No pirksta izzīsti lielumi :D
    });
  }

  return wheel;
}
