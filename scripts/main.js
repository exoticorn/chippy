require(['react-0.12.0.js', 'player', 'patterneditor', 'playlisteditor', 'instrumenteditor', 'async'],
    function(React, Player, PatternEditorClass, PlayListEditor, InstrumentEditorClass, async) {
  'use strict';
  
  var PatternEditor = React.createFactory(PatternEditorClass);
  var InstrumentEditor = React.createFactory(InstrumentEditorClass);
  
  var D = React.DOM;
  
  var audioContext = new AudioContext();
  
  function createPattern() {
    var pattern = [];
    for(var c = 0; c < 3; ++c) {
      var channel = [];
      for(var r = 0; r < 64; ++r) {
        channel.push({});
      }
      pattern.push(channel);
    }
    return pattern;
  }
  
  var song = {
    patterns: [createPattern()],
    playlist: [[0, 0, 0]],
    insts: [
      {
        osci: 'rect',duty: 0
      },
      {
        osci: 'square',
        arp: {
          list: [24, 19, 12, 19, 12, 7, 12, 7, 0, 7, 0]
        },
        vol: {
          env: [1, 15, 60, 8]
        }
      }
    ]
  };

  var player = new Player(audioContext);
  player.setSong(song);
  
  var scratchInst;
  
  function updateScratch() {
    if(scratchInst) {
      scratchInst.updateUntil(audioContext.currentTime + 0.3);
    }
  }
  setInterval(updateScratch, 100);
  function stopScratch() {
    if(scratchInst) {
      scratchInst.stop(audioContext.currentTime);
      scratchInst = undefined;
    }
  }

  function selectFile(mode) {
    return new Promise(function(resolve, reject) {
      chrome.fileSystem.chooseEntry({
        type: mode === 'save' ? 'saveFile' : 'openWritableFile',
        suggestedName: 'song.cpy',
        accepts: [
          {description: 'Chippy song', extensions: ['cpy']}
        ],
        acceptsAllTypes: false
      }, resolve);
    });
  }
  
  function writeJson(entry, data) {
    entry.createWriter(function(writer) {
      writer.truncate(0);
      writer.write(new Blob([JSON.stringify(data)]));
    });
  }
  
  function loadJson(entry) {
    return new Promise(function(resolve, reject) {
      entry.file(function(file) {
        var reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = function(e) {
          try {
            resolve(JSON.parse(e.target.result));
          } catch(e) {
            reject(e);
          }
        };
        reader.readAsText(file);
      });
    });
  }
  
  var noteKeys = [90, 83, 88, 68, 67, 86, 71, 66, 72, 78, 74, 77, 81, 50, 87, 51, 69, 82, 53, 84, 54, 89, 55,
    85, 73, 57, 79, 48, 80];
  var keyNote = [];
  noteKeys.forEach(function(key, note) { keyNote[key] = note; });

  var App = React.createClass({
    getInitialState: function() {
      return {
        lastKey: '',
        pattern: song.patterns[0],
        patternIdx: [0, 0, 0],
        currentInstrument: 0,
        noteOffset: 3
      };
    },
    componentDidMount: function() {
      document.body.onkeydown = this.keyDown;
    },
    load: async.proc(function*() {
      this.stop();
      var entry = yield selectFile('load');
      if(entry) {
        song = yield loadJson(entry);
        player.setSong(song);
        this.state.patternIdx = [-1, 0, 0];
        this.updatePattern(0);
        this.setState({ entry: entry });
      }
    }),
    save: function() {
      if(this.state.entry) {
        writeJson(this.state.entry, song);
      } else {
        this.saveAs();
      }
    },
    saveAs: async.proc(function*() {
      var entry = yield selectFile('save');
      if(entry) {
        writeJson(entry, song);
        this.setState({ entry: entry });
      }
    }),
    keyToNote: function(event) {
      if(event.ctrlKey) {
        return;
      }
      var note = keyNote[event.keyCode];
      if(note !== undefined) {
        event.preventDefault();
        event.stopPropagation();
        return { note: note + this.state.noteOffset};
      }
    },
    keyDown: function(e) {
      this.setState({ lastKey: e.keyCode });
      if(e.ctrlKey) {
        switch(e.keyCode) {
          case 79:
            this.load();
            e.preventDefault();
            break;
          case 83:
            if(e.shiftKey) {
              this.saveAs();
            } else {
              this.save();
            }
            e.preventDefault();
            break;
          case 80:
            if(this.state.playing === 'pattern') {
              this.stop();
            } else {
              this.playPattern();
            }
            e.preventDefault();
            break;
          case 188:
          case 190:
            this.setState({ noteOffset: this.state.noteOffset + (e.keyCode - 189) * 12 });
            e.preventDefault();
            break;
        }
      }
      if(e.altKey) {
        var note = keyNote[e.keyCode];
        if(note !== undefined) {
          event.preventDefault();
          event.stopPropagation();
          stopScratch();
          scratchInst = new player.instruments.Instrument(song.insts[this.state.currentInstrument],
            audioContext.currentTime, note + this.state.noteOffset);
          scratchInst.updateUntil(audioContext.currentTime + 0.2);
        } else if(e.keyCode === 32) {
          stopScratch();
        }
      }
    },
    stop: function() {
      player.stop();
      this.setState({ playing: false });
      stopScratch();
    },
    playPattern: function() {
      player.playPattern(this.state.pattern);
      this.setState({ playing: 'pattern' });
    },
    playSong: function() {
      player.playSong(song);
      this.setState({ playing: 'song' });
    },
    updatePattern: function(row) {
      var pat = song.playlist[row];
      var old = this.state.patternIdx;
      if(pat[0] !== old[0] || pat[1] !== old[1] || pat[2] !== old[2]) {
        var max = Math.max(pat[0], Math.max(pat[1], pat[2]));
        var patterns = song.patterns;
        while(patterns.length < max + 1) {
          patterns.push(createPattern());
        }
        this.setState({
          patternIdx: pat.slice(),
          pattern: pat.map(function(i, c) { return patterns[i][c]; })
        });
        if(this.state.playing === 'pattern') {
          this.stop();
        }
      }
    },
    instChange: function(inst) {
      song.insts[this.state.currentInstrument] = inst;
    },
    render: function() {
      return D.div({ className: 'main-box' },
        D.div({className: 'file-ops'},
          D.div(null, D.button({ type: 'button', onClick: this.load }, 'Load...')),
          D.div(null, D.button({ type: 'button', onClick: this.save }, 'Save')),
          D.div(null, D.button({ type: 'button', onClick: this.saveAs }, 'Save As...')),
          D.div(null, D.button({ type: 'button', onClick: this.stop }, 'Stop')),
          D.div(null, D.button({ type: 'button', onClick: this.playPattern }, 'Play Pattern')),
          D.div(null, D.button({ type: 'button', onClick: this.playSone }, 'Play Song')),
          D.div(null, this.state.lastKey ),
          D.div(null, 'Oct: ' + ((this.state.noteOffset - 3) / 12 + 3))
        ),
        PatternEditor({ channels: this.state.pattern, keyToNote: this.keyToNote, player: player }),
        PlayListEditor({ playlist: song.playlist, updatePattern: this.updatePattern }),
        InstrumentEditor({ song: song, currentInstrument: this.state.currentInstrument, onChange: this.instChange })
      );
    }
  });
  
  React.render(React.createElement(App, null), document.body);
});