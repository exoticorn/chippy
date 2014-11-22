define(function() {
  'use strict';
  
  var Instruments = function(ctx) {
    var oneBuffer = ctx.createBuffer(1, 128, 22050);
    var oneData = oneBuffer.getChannelData(0);
    for(var i = 0; i < 128; ++i) {
      oneData[i] = 1;
    }
    var oneSrc = ctx.createBufferSource();
    oneSrc.buffer = oneBuffer;
    oneSrc.loop = true;
    oneSrc.start();
    
    this.Instrument = function(data, time, note) {
      this.data = data;
      this.time = time;
      this.frame = 0;
      this.note = note;
      this.osci = ctx.createOscillator();
      this.osci.type = data.osci;
      this.gain = ctx.createGain();
      this.step();
      this.osci.connect(this.gain);
      this.gain.connect(ctx.destination);
      this.osci.start(time);
    };
    this.Instrument.prototype = {
      step: function() {
        var frame = this.frame;
        var arp;
        if(this.data.arpLoop) {
          arp = this.data.arp[frame % this.data.arp.length];
        } else {
          arp = this.data.arp[Math.min(frame, this.data.arp.length - 1)];
        }
        this.osci.detune.setValueAtTime((this.note + arp) * 100, this.time);
        
        var env = this.data.env;
        var vol = env[2];
        if(frame < env[0]) {
          vol = 15 * (frame + 0.5) / env[0];
        } else if(frame < env[0] + env[1]) {
          vol = 15 + (env[2] - 15) * (frame - env[0] + 0.5) / env[1];
        }
        this.gain.gain.setValueAtTime(vol / 15, this.time);
        this.frame++;
        this.time += 1 / 60;
      },
      updateUntil: function(time) {
        while(this.time < time) {
          this.step();
        }
      },
      stop: function(time) {
        this.osci.stop(time);
      }
    };
  };

  return Instruments;
});