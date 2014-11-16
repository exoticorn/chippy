require(['react-0.12.0.js', 'player', 'patterneditor', 'playlisteditor', 'async'],
    function(React, Player, PatternEditorClass, PlayListEditor, async) {
  'use strict';
  
  var PatternEditor = React.createFactory(PatternEditorClass);
  
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
    playlist: [[0, 0, 0], [0, 0, 0]]
  };

  var player = new Player(audioContext);

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
      return { lastKey: '' };
    },
    componentDidMount: function() {
      document.body.onkeydown = this.keyDown;
    },
    load: async.proc(function*() {
      this.stop();
      var entry = yield selectFile('load');
      if(entry) {
        song = yield loadJson(entry);
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
        return { note: note + 3};
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
        }
      }
    },
    stop: function() {
      player.stop();
      this.setState({ playing: false });
    },
    playPattern: function() {
      player.playPattern(song.patterns[0]);
      this.setState({ playing: 'pattern' });
    },
    playSong: function() {
      player.playSong(song);
      this.setState({ playing: 'song' });
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
          D.div(null, this.state.lastKey )
        ),
        PatternEditor({ channels: song.patterns[0], keyToNote: this.keyToNote, player: player }),
        PlayListEditor({ playlist: song.playlist })
      );
    }
  });
  
  React.render(React.createElement(App, null), document.body);
});