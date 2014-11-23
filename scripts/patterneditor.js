define(['react-0.12.0.js'], function(React) {
  var D = React.DOM;
  
  var NUM_CHANNELS = 3;
  var COLS_PER_CHANNEL = 2;
  
  var NUM_COLS = NUM_CHANNELS * COLS_PER_CHANNEL;
  
  var NOTES = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'];
  
  return React.createClass({
    getInitialState: function() {
      return { x: 0, y : 0 };
    },
    componentDidUpdate: function() {
      if(this.refs.selectedRow) {
        var e = this.refs.selectedRow.getDOMNode();
        var rect = e.getBoundingClientRect();
        if(rect.top < 0) {
          e.scrollIntoView();
        } else if(rect.bottom > window.innerHeight) {
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
        this.setState({ y: (this.state.y + 48) % 64 });
        e.preventDefault();
        break;
      case 34:
        this.setState({ y: (this.state.y + 16) % 64 });
        e.preventDefault();
        break;
      case 8: this.note({note: undefined}); e.preventDefault(); break;
      default:
        var noteOn = this.props.keyToNote(e);
        if(noteOn) {
          this.note(noteOn);
        }
        break;
      }
    },
    note: function(noteOn) {
      if(this.state.x % COLS_PER_CHANNEL !== 0) {
        return;
      }
      var c = this.state.x / COLS_PER_CHANNEL;
      this.props.player.handleRow(c, noteOn);
      var e = this.props.channels[this.state.x / COLS_PER_CHANNEL][this.state.y];
      e.note = noteOn.note;
      e.inst = this.props.currentInstrument;
      this.setState({ y: (this.state.y + 1) % 64 });
    },
    render: function() {
      var rows = [];
      for(var r = 0; r < this.props.channels[0].length; ++r) {
        var row = [D.td(null, r + 1)];
        for(var c = 0; c < this.props.channels.length; ++c) {
          var selectedCol = this.state.x - c * COLS_PER_CHANNEL;
          var e = this.props.channels[c][r];
          var note = e.note === undefined ? '---' : NOTES[(e.note - 3 + 12*3) % 12] + Math.floor((e.note - 3 + 12*3) / 12);
          row.push(D.td({ className: r === this.state.y && selectedCol === 0 ? 'selected' : ''}, note));
          var instChar = e.inst === undefined ? '-' : (e.inst < 10 ? '' + e.inst : String.fromCharCode(55 + e.inst));
          row.push(D.td({ className: r === this.state.y && selectedCol === 1 ? 'selected' : ''}, instChar));
        }
        var selected = r === this.state.y;
        rows.push(
          D.tr({
            className: selected ? 'selected' : (r % 4 === 0) ? 'fourth' : '',
            ref: selected ? 'selectedRow' : undefined
          }, row));
      }
      
      return D.div({className: 'edit-table-wrapper'},
        D.table({ className: 'edit-table pattern', tabIndex: 1, onKeyDown: this.keyDown },
          D.tbody(null,
            rows
          )
        )
      );
    }
  });
});