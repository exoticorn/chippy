define(['react-0.12.0.js'], function(React) {
  var D = React.DOM;
  
  return React.createClass({
    getInitialState: function() {
      return {
        text: this.formatInstrument(this.props.song.insts[this.props.currentInstrument]),
        parseResult: 'ok' };
    },
    componentWillReceiveProps: function(props) {
      if(props.song !== this.props.song || props.currentInstrument !== this.props.currentInstrument) {
        this.setState({
          text: this.formatInstrument(props.song.insts[props.currentInstrument])
        });
      }
    },
    formatInstrument: function(inst) {
      function formatJson(val, indent) {
        var result;
        var nextIndent;
        if(Array.isArray(val)) {
          var allPlain = true;
          val.forEach(function(v) {
            if(typeof(v) === 'object') {
              allPlain = false;
            }
          });
          if(allPlain) {
            return JSON.stringify(val);
          }
          result = '[\n';
          nextIndent = indent + '  ';
          val.forEach(function(v, index) {
            result += nextIndent + formatJson(v, nextIndent);
            if(index < val.length - 1) {
              result += ',';
            }
            result += '\n';
          });
          return result + indent + ']';
        }
        if(typeof(val) === 'object') {
          result = '{';
          nextIndent = indent + '  ';
          var first = true;
          for(var key in val) {
            result += first ? '\n' : ',\n';
            first = false;
            result += nextIndent + '"' + key + '": ' + formatJson(val[key], nextIndent);
          }
          return result + '\n' + indent + '}';
        }
        return JSON.stringify(val);
      }
      return formatJson(inst, '');
    },
    textChanged: function(e) {
      var text = e.target.value;
      var parseResult = 'ok';
      var inst;
      try {
        inst = JSON.parse(text);
      } catch(e) {
        parseResult = 'Error: ' + e;
      }
      this.setState({ text: e.target.value, parseResult: parseResult });
      if(inst && this.props.onChange) {
        this.props.onChange(inst);
      }
    },
    keyDown: function(e) {
      switch(e.keyCode) {
        case 70:
          if(e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            if(this.state.parseResult === 'ok') {
              this.setState({
                text: this.formatInstrument(JSON.parse(this.state.text))
              });
            }
          }
          break;
      }
    },
    render: function() {
      return D.div(null,
        D.h2(null, 'Instrument ' + this.props.currentInstrument),
        D.textarea({ value: this.state.text, tabIndex: 2, onChange: this.textChanged, onKeyDown: this.keyDown, cols: 40, rows: 14 }),
        D.div(null, this.state.parseResult)
      );
    }
  });
});