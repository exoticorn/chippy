define(['react-0.12.0.js'], function(React) {
  var D = React.DOM;
  
  var NUM_CHANNELS = 3;

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
      var rows = this.props.playlist.length;
      var newY;
      if(e.ctrlKey) {
        switch(e.keyCode) {
          case 73:
            this.props.playlist.splice(this.state.y + (e.shiftKey ? 1 : 0), 0, [0, 0, 0]);
            e.preventDefault();
            newY = this.state.y + (e.shiftKey ? 1 : 0);
            this.setState({ y: newY });
            this.props.updatePattern(newY);
            break;
          case 68:
            if(rows > 1) {
              this.props.playlist.splice(this.state.y, 1);
              newY = Math.min(this.state.y, rows - 2);
              this.setState({ y: newY });
              this.props.updatePattern(newY);
            }
            e.preventDefault();
            break;
        }
        return;
      }
      switch(e.keyCode) {
      case 37:
        this.setState({ x: (this.state.x + NUM_CHANNELS - 1) % NUM_CHANNELS });
        e.preventDefault();
        break;
      case 39:
        this.setState({ x: (this.state.x + 1) % NUM_CHANNELS });
        e.preventDefault();
        break;
      case 38:
        newY = (this.state.y + rows - 1) % rows;
        this.setState({ y: newY });
        this.props.updatePattern(newY);
        e.preventDefault();
        break;
      case 40:
        newY = (this.state.y + 1) % rows;
        this.setState({ y: newY });
        this.props.updatePattern(newY);
        e.preventDefault();
        break;
      default:
        var pattern = e.keyCode - 48;
        if(pattern < 0) {
          return;
        }
        if(pattern >= 10) {
          if(e.keyCode < 65 || e.keyCode >= 65 + 26) {
            return;
          }
          pattern = e.keyCode - 55;
        }
        this.props.playlist[this.state.y][this.state.x] = pattern;
        var newX = (this.state.x + 1) % 3;
        this.setState({ x: newX });
        this.props.updatePattern(this.state.y);
        break;
      }
    },
    render: function() {
      var self = this;
      return D.div({className: 'edit-table-wrapper', ref: 'wrapper'},
        D.table({ className: 'edit-table pattern', tabIndex: 3, onKeyDown: this.keyDown },
          D.tbody(null,
            this.props.playlist.map(function(row, index) {
              var selected = index === self.state.y;
              return D.tr({
                className: selected ? 'selected' : '',
                ref: selected ? 'selectedRow' : undefined
              }, row.map(function(pattern, channel) {
                var patternChar = pattern < 10 ? '' + pattern : String.fromCharCode(55 + pattern);
                return D.td({
                  className: selected && channel === self.state.x ? 'selected' : ''
                }, patternChar);
              }));
            })
          )
        )
      );
    }
  });
});