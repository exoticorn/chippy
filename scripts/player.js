define(['instrument'], function(Instruments) {
  return function(ctx) {
    var insts = new Instruments(ctx);
    
    var channels = [];
    
    var pattern = [];
    var time = 0;
    var playing = false;
    var patternPos = 0;
    
    function update() {
      if(!playing) return;
      while(time < ctx.currentTime + 0.5) {
        for(c = 0; c < pattern.length; ++c) {
          var e = pattern[c][patternPos];
          if(e.note !== undefined) {
            if(channels[c] !== undefined) {
              channels[c].stop(time);
            }
            channels[c] = new insts.Pling(time, e.note);
            channels[c].out.connect(ctx.destination);
          }
        }
        time += 15 / 120;
        patternPos = (patternPos + 1) % 64;
      }
    }
    
    setInterval(update, 400);
    
    this.playPattern = function(p) {
      this.stop();
      pattern = p;
      time = ctx.currentTime + 0.1;
      patternPos = 0;
      playing = true;
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