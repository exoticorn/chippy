define(['react-0.12.0.js'], function(React) {
  var D = React.DOM;
  
  var NUM_CHANNELS = 3;
  var COLS_PER_CHANNEL = 1;
  
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
      case 90: this.note(0); break;
      case 83: this.note(1); break;
      case 88: this.note(2); break;
      case 68: this.note(3); break;
      case 67: this.note(4); break;
      case 86: this.note(5); break;
      case 71: this.note(6); break;
      case 66: this.note(7); break;
      case 72: this.note(8); break;
      case 78: this.note(9); break;
      case 74: this.note(10); break;
      case 77: this.note(11); break;
      case 81: this.note(12); break;
      case 50: this.note(13); break;
      case 87: this.note(14); break;
      case 51: this.note(15); break;
      case 69: this.note(16); break;
      case 82: this.note(17); break;
      case 53: this.note(18); break;
      case 84: this.note(19); break;
      case 54: this.note(20); break;
      case 89: this.note(21); break;
      case 55: this.note(22); break;
      case 85: this.note(23); break;
      case 73: this.note(24); break;
      case 57: this.note(25); break;
      case 79: this.note(26); break;
      case 48: this.note(27); break;
      case 80: this.note(28); break;
      case 8: this.note(undefined); e.preventDefault(); break;
      default:
        console.log(e.keyCode);
      }
    },
    note: function(note) {
      if(this.state.x % COLS_PER_CHANNEL !== 0) {
        return;
      }
      this.props.channels[this.state.x / COLS_PER_CHANNEL][this.state.y].note = note === undefined ? undefined : note + 3;
      this.setState({ y: (this.state.y + 1) % 64 });
    },
    render: function() {
      var rows = [];
      for(var r = 0; r < this.props.channels[0].length; ++r) {
        var row = [D.td(null, r + 1)];
        for(var c = 0; c < this.props.channels.length; ++c) {
          var e = this.props.channels[c][r];
          var note = e.note === undefined ? '---' : NOTES[(e.note - 3) % 12] + Math.floor((e.note - 3) / 12);
          row.push(D.td({ className: r === this.state.y && c * COLS_PER_CHANNEL === this.state.x ? 'selected' : ''}, note));
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