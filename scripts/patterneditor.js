define(['react-0.12.0.js'], function(React) {
  var D = React.DOM;
  
  var NUM_CHANNELS = 3;
  var COLS_PER_CHANNEL = 6;
  
  var NUM_COLS = NUM_CHANNELS * COLS_PER_CHANNEL;
  
  var NOTES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
  
  function copyNote(src, dst) {
    dst = dst || {};
    dst.note = src.note;
    dst.inst = src.inst;
    dst.vol = src.vol;
    dst.effect = src.effect;
    dst.effect1 = src.effect1;
    dst.effect2 = src.effect2;
    return dst;
  }
  
  function keyNibble(e) {
    if(e.keyCode >= 48 && e.keyCode < 58) {
      return e.keyCode - 48;
    }
    if(e.keyCode >= 65 && e.keyCode < 65 + 26) {
      return e.keyCode - 55;
    }
  }
  
  return React.createClass({
    getInitialState: function() {
      return { x: 0, y : 0 };
    },
    componentDidUpdate: function() {
      if(this.refs.selectedRow) {
        var e = this.refs.selectedRow.getDOMNode();
        var rect = e.getBoundingClientRect();
        var wrapperRect = this.refs.wrapper.getDOMNode().getBoundingClientRect();
        if(rect.top < wrapperRect.top) {
          e.scrollIntoView();
        } else if(rect.bottom > wrapperRect.bottom) {
          e.scrollIntoView(false);
        }
      }
    },
    keyDown: function(e) {
      switch(e.keyCode) {
      case 37:
        this.setState({ x: (this.state.x + NUM_COLS - 1) % NUM_COLS });
        e.preventDefault();
        break;
      case 39:
        this.setState({ x: (this.state.x + 1) % NUM_COLS });
        e.preventDefault();
        break;
      case 38:
        this.setState({ y: (this.state.y + 63) % 64 });
        e.preventDefault();
        break;
      case 40:
        this.setState({ y: (this.state.y + 1) % 64 });
        e.preventDefault();
        break;
      case 33:
        this.setState({ y: ((this.state.y + 63) & ~15) % 64 });
        e.preventDefault();
        break;
      case 34:
        this.setState({ y: ((this.state.y + 16) & ~15) % 64 });
        e.preventDefault();
        break;
      case 8: this.note({note: undefined}); e.preventDefault(); break;
      default:
        var x, y, copyData, chan;
        if(e.ctrlKey) {
          switch(e.keyCode) {
            case 77:
              x = Math.floor(this.state.x / COLS_PER_CHANNEL);
              y = this.state.y;
              this.setState({ mark: {x: x, y: y} });
              this.props.onMessage('Mark set at ' + x + ',' + y);
              e.preventDefault();
              break;
            case 67:
              if(this.state.mark) {
                copyData = [];
                x = Math.floor(this.state.x / COLS_PER_CHANNEL);
                var x1 = Math.min(this.state.mark.x, x), x2 = Math.max(this.state.mark.x, x);
                var y1 = Math.min(this.state.mark.y, this.state.y), y2 = Math.max(this.state.mark.y, this.state.y);
                for(x = x1; x <= x2; ++x) {
                  chan = [];
                  for(y = y1; y <= y2; ++y) {
                    chan.push(copyNote(this.props.channels[x][y]));
                  }
                  copyData.push(chan);
                }
                this.setState({ copyData: copyData, mark: undefined });
                this.props.onMessage('Copied ' + x1 + ',' + y1 + ' - ' + x2 + ',' + y2);
              }
              e.preventDefault();
              break;
            case 86:
              copyData = this.state.copyData;
              if(copyData !== undefined) {
                for(x = 0; x < copyData.length; ++x) {
                  chan = this.props.channels[(Math.floor(this.state.x / COLS_PER_CHANNEL) + x) % this.props.channels.length];
                  for(y = 0; y < copyData[x].length; ++y) {
                    copyNote(copyData[x][y], chan[(this.state.y + y) % chan.length]);
                  }
                }
                this.forceUpdate();
              }
              e.preventDefault();
              break;
          }
        } else {
          var c = this.state.x % COLS_PER_CHANNEL;
          x = Math.floor(this.state.x / COLS_PER_CHANNEL);
          switch(c) {
            case 0:
              var noteOn = this.props.keyToNote(e);
              if(noteOn) {
                this.note(noteOn);
              }
              break;
            case 1:
              var inst = keyNibble(e);
              if(inst !== undefined && inst < 16) {
                this.props.channels[x][this.state.y].inst = inst;
                this.setState({ y: (this.state.y + 1) % 64 });
              }
              break;
            case 2:
              var vol = keyNibble(e);
              if(vol !== undefined && vol < 16) {
                this.props.channels[x][this.state.y].vol = vol;
                this.setState({ y: (this.state.y + 1) % 64 });
              } else if(e.keyCode === 189) {
                this.props.channels[x][this.state.y].vol = undefined;
                this.setState({ y: (this.state.y + 1) % 64 });
              }
              break;
            case 3:
              if(e.keyCode >= 65 && e.keyCode < 65 + 26) {
                this.props.channels[x][this.state.y].effect = String.fromCharCode(e.keyCode);
                this.setState({ y: (this.state.y + 1) % 64 });
              } else if(e.keyCode === 189) {
                this.props.channels[x][this.state.y].effect = undefined;
                this.setState({ y: (this.state.y + 1) % 64 });
              }
              break;
            case 4:
            case 5:
              var val = keyNibble(e);
              if(val !== undefined) {
                this.props.channels[x][this.state.y][c === 4 ? 'effect1' : 'effect2'] = val;
                this.setState({ y: (this.state.y + 1) % 64 });
              }
              break;
          }
        }
        break;
      }
    },
    note: function(noteOn) {
      if(this.state.x % COLS_PER_CHANNEL !== 0) {
        return;
      }
      var c = Math.floor(this.state.x / COLS_PER_CHANNEL);
      var e = this.props.channels[this.state.x / COLS_PER_CHANNEL][this.state.y];
      e.note = noteOn.note;
      e.inst = noteOn.note === undefined ? undefined : this.props.currentInstrument;
      this.props.player.handleRow(c, e);
      this.setState({ y: (this.state.y + 1) % 64 });
    },
    render: function() {
      var rows = [];
      var rowSelected;
      var row;
      function pushCol(col, text) {
        row.push(D.td({ className: rowSelected && selectedCol === col ? 'selected' : ''}, text));
      }
      function nibble(val) {
        return String.fromCharCode(val < 10 ? 48 + val : 55 + val);
      }
      for(var r = 0; r < this.props.channels[0].length; ++r) {
        row = [D.td(null, r + 1)];
        rowSelected = r === this.state.y;
        for(var c = 0; c < this.props.channels.length; ++c) {
          var selectedCol = this.state.x - c * COLS_PER_CHANNEL;
          var e = this.props.channels[c][r];
          var note = e.note === undefined ? '---' : NOTES[(e.note - 3 + 12*3) % 12] + Math.floor((e.note - 3 + 12*3) / 12);
          pushCol(0, note);
          pushCol(1, e.inst === undefined ? '-' : nibble(e.inst));
          pushCol(2, e.vol === undefined ? '-' : nibble(e.vol));
          pushCol(3, e.effect === undefined ? '-' : e.effect);
          pushCol(4, nibble(e.effect1 | 0));
          pushCol(5, nibble(e.effect2 | 0));
        }
        rows.push(
          D.tr({
            className: rowSelected ? 'selected' : (r % 4 === 0) ? 'fourth' : '',
            ref: rowSelected ? 'selectedRow' : undefined
          }, row));
      }
      
      return D.div({className: 'edit-table-wrapper', ref: 'wrapper'},
        D.table({ className: 'edit-table pattern', tabIndex: 1, onKeyDown: this.keyDown },
          D.tbody(null,
            rows
          )
        )
      );
    }
  });
});