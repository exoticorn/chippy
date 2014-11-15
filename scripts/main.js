require(['react-0.12.0.js', 'player', 'patterneditor', 'async'], function(React, Player, PatternEditorClass, async) {
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
  
  var dummyPattern = createPattern();
  
  var player = new Player(audioContext);
  player.playPattern(dummyPattern);
  
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

  var App = React.createClass({
    getInitialState: function() {
      return {};
    },
    load: async.proc(function*() {
      var entry = yield selectFile('load');
      if(entry) {
        var song = yield loadJson(entry);
        dummyPattern = song.patterns[0];
        this.setState({ entry: entry });
      }
    }),
    save: function() {
      if(this.state.entry) {
        writeJson(this.state.entry, {patterns: [dummyPattern]});
      } else {
        this.saveAs();
      }
    },
    saveAs: async.proc(function*() {
      var entry = yield selectFile('save');
      if(entry) {
        writeJson(entry, {patterns: [dummyPattern]});
        this.setState({ entry: entry });
      }
    }),
    render: function() {
      return D.div({ className: 'main-box' },
        D.div({className: 'file-ops'},
          D.div(null, D.button({ type: 'button', onClick: this.load }, 'Load...')),
          D.div(null, D.button({ type: 'button', onClick: this.save }, 'Save')),
          D.div(null, D.button({ type: 'button', onClick: this.saveAs }, 'Save As...'))
        ),
        PatternEditor({ channels: dummyPattern }));
    }
  });
  
  React.render(React.createElement(App, null), document.body);
});