define(['instrument'], function(Instruments) {
  return function(ctx) {
    this.instruments = new Instruments(ctx);
    
    var channels = [];
    
    var pattern = [];
    var song = {};
    var time = 0;
    var playing = false;
    var playlistIndex;
    var patternPos = 0;
    var patternBreak;
    var tempo = 120;
    
    var self = this;
    
    function update() {
      var c;
      if(!playing) {
        for(c = 0; c < channels.length; ++c) {
          if(channels[c] !== undefined) {
            channels[c].updateUntil(ctx.currentTime + 0.25);
          }
        }
        return;
      }
      while(time < ctx.currentTime + 0.4) {
        patternBreak = undefined;
        for(c = 0; c < pattern.length; ++c) {
          self.handleRow(c, pattern[c][patternPos], time);
        }
        time += 15 / tempo;
        if(++patternPos >= 64 || patternBreak !== undefined) {
          patternPos = patternBreak|0;
          if(playlistIndex !== undefined) {
            nextPattern();
          }
        }
      }
    }
    
    setInterval(update, 200);
    
    this.handleRow = function(c, e, time) {
      if(time === undefined) {
        time = ctx.currentTime;
      }
      if(channels[c] !== undefined) {
        channels[c].updateUntil(time);
      }
      if(e.note !== undefined) {
        if(e.effect === 'L' && channels[c] !== undefined) {
          channels[c].slideTo(e.note, ((e.effect1|0) << 4) | e.effect2);
        } else {
          if(channels[c] !== undefined) {
            channels[c].stop(time);
          }
          channels[c] = new this.instruments.Instrument(song.insts[e.inst|0], time, e.note);
        }
      }
      if(e.vol !== undefined && channels[c] !== undefined) {
        channels[c].setVol(e.vol);
      }
      switch(e.effect) {
        case 'A':
          if(channels[c] !== undefined) {
            channels[c].setArpeggio(e.effect1|0, e.effect2|0);
          }
          break;
        case 'B':
          patternBreak = (((e.effect1|0) << 4) | e.effect2) % 64;
          break;
        case 'S':
        case 'H':
          if(channels[c] !== undefined) {
            channels[c].slideFrom(
              (e.effect1|0) >= 8 ? (e.effect1|0)-16 : e.effect1|0,
              e.effect2|0,
              e.effect === 'H'
            );
          }
          break;
        case 'T':
          tempo = ((e.effect1|0) << 4) | e.effect2;
          break;
      }
      if(channels[c] !== undefined) {
        channels[c].step();
      }
    };
    
    function nextPattern() {
      playlistIndex = playlistIndex % song.playlist.length;
      var pat = song.playlist[playlistIndex++];
      var patterns = song.patterns;
      pattern = pat.map(function(i, c) { return patterns[i][c]; });
      patternPos = 0;
    }
    
    this.setSong = function(s) {
      song = s;
    };
    
    this.playPattern = function(p) {
      this.stop();
      pattern = p;
      time = ctx.currentTime + 0.1;
      patternPos = 0;
      playing = true;
      playlistIndex = undefined;
      tempo = song.tempo;
      update();
    };
    
    this.playSong = function(index) {
      this.stop();
      playlistIndex = index;
      nextPattern();
      time = ctx.currentTime + 0.1;
      playing = true;
      tempo = song.tempo;
      update();
    };
    
    this.stop = function() {
      playing = false;
      channels.forEach(function(c) {
        if(c !== undefined) {
          c.stop(time);
        }
      });
      channels = [];
    };
  };
});