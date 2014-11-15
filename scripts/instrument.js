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
    
    var Instrument = function() {};
    Instrument.prototype = {
      setupInstrument: function(note) {
        this.noteIn = ctx.createGain();
        oneSrc.connect(this.noteIn);
        this.noteIn.gain.value = note * 100;
        this.note = note;
        
        this.detune = this.noteIn;
      },
      slide: function(time, duration, note) {
        if(duration <= 0) {
          this.noteIn.gain.setValueAtTime(note * 100, time);
        } else {
          this.noteIn.gain.setValueAtTime(this.note * 100, time);
          this.noteIn.gain.linearRampToValueAtTime(note * 100, time + duration);
        }
        this.note = note;
      }
    };
    
    var YM = function() {};
    YM.prototype = new Instrument();
    YM.prototype.setupYM = function(time, note) {
      this.setupInstrument(note);
      this.osci = ctx.createOscillator();
      this.osci.type = 'square';
      this.detune.connect(this.osci.detune);
      this.osci.start(time);
      
      this.gain = ctx.createGain();
      this.osci.connect(this.gain);
      
      this.out = this.gain;
    };
    YM.prototype.stop = function(time) {
      this.osci.stop(time);
    };
    
    this.Pling = function(time, note) {
      this.setupYM(time, note);
      this.osci.detune.value = -12*100;
      this.osci.detune.setValueAtTime(0, time + 0.1);
      this.gain.gain.setValueAtTime(1, 0);
      this.gain.gain.linearRampToValueAtTime(0, time + 1);
    };
    this.Pling.prototype = new YM();
  };

  return Instruments;
});