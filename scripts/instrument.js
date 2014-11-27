define(function() {
  'use strict';
  
  var Instruments = function(ctx) {
    var oneBuffer = ctx.createBuffer(1, 128, 22050);
    var oneData = oneBuffer.getChannelData(0);
    var i;
    for(i = 0; i < 128; ++i) {
      oneData[i] = 1;
    }
    var rectCurve = new Float32Array(256);
    for(i = 0; i < 256; ++i) {
      rectCurve[i] = (i >= 255) ? 1 : -1;
    }
    var triCurve = new Float32Array([0, -1, 0, 1, 0]);
    
    this.Instrument = function(data, time, note, vol) {
      this.data = data;
      this.time = time;
      this.frame = 0;
      this.note = note;
      this.vol = vol === undefined ? 15 : vol;
      this.osci = ctx.createOscillator();
      var osciOut;
      switch(data.osci) {
        case 'rect':
          this.osci.type = 'sawtooth';
          this.dutyGain = ctx.createGain();
          this.dutyGain.gain.value = 1;
          osciOut = ctx.createWaveShaper();
          osciOut.oversample = '4x';
          osciOut.curve = rectCurve;
          this.osci.connect(this.dutyGain);
          this.dutyGain.connect(osciOut);
          break;
        default:
          this.osci.type = data.osci;
          osciOut = this.osci;
          break;
      }
      this.gain = ctx.createGain();
      this.gain.gain.value = 0;
      this.step();
      osciOut.connect(this.gain);
      this.gain.connect(ctx.destination);
      this.osci.start(time);
    };
    this.Instrument.prototype = {
      step: function() {
        var frame = this.frame;
        var lfo = 0;
        function evalProg(p, one) {
          if(typeof p !== 'object') {
            return p || one;
          }
          var list = one, env = one, osc = one;
          if(p.list) {
            if(p.loop) {
              list = p.list[frame % p.list.length];
            } else {
              list = p.list[Math.min(frame, p.list.length - 1)];
            }
          }
          if(p.env) {
            var left = 0;
            var t = frame + 0.5;
            var i = 0;
            env = p.env[p.env.length - 1];
            while(i < p.env.length - 1) {
              if(t < p.env[i]) {
                env = left + (p.env[i + 1] - left) * t / p.env[i];
                break;
              }
              t -= p.env[i];
              left = p.env[i+1];
              i += 2;
            }
          }
          if(p.lfo) {
            osc = evalProg(p.lfo, 1) * lfo;
          }
          return one ? list * env / one * osc / one : list + env + osc;
        }
        if(this.data.lfo) {
          lfo = Math.sin(this.time * evalProg(this.data.lfo, 0) * 2 * Math.PI);
        }
        var arpOffset = this.arpeggio !== undefined ? this.arpeggio[frame % this.arpeggio.length] : 0;
        this.osci.detune.setValueAtTime((this.note + evalProg(this.data.tune || this.data.arp, 0) + arpOffset) * 100, this.time);
        this.gain.gain.setValueAtTime(evalProg(this.data.vol, 15) / 15 * this.vol / 15 / 3, this.time);
        if(this.dutyGain) {
          var duty = evalProg(this.data.duty, 0);
          this.dutyGain.gain.setValueAtTime(1.0 / (duty + 0.001), this.time);
        }
        this.frame++;
        this.time += 1 / 60;
      },
      updateUntil: function(time) {
        while(this.time < time) {
          this.step();
        }
      },
      setVol: function(vol) {
        this.vol = vol;
      },
      setArpeggio: function(arp1, arp2) {
        this.arpeggio = [0, arp1, arp2];
      },
      stop: function(time) {
        this.osci.stop(time);
      }
    };
  };

  return Instruments;
});