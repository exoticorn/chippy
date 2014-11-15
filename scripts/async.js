if (typeof Promise.prototype.done !== 'function') {
  Promise.prototype.done = function (onFulfilled, onRejected) {
    var self = arguments.length ? this.then.apply(this, arguments) : this;
    self.then(null, function (err) {
      setTimeout(function () {
        throw err;
      }, 0);
    });
  };
}

define(function() {
  var async = function(gen) {
    return function() {
      var iter = gen.apply(this, arguments);
      
      function step(res) {
        var val = Promise.resolve(res.value);
        if(res.done) {
          return val;
        }
        return val.then(function(val) {
          return step(iter.next(val));
        }, function(err) {
          return step(iter.throw(err));
        });
      }
      
      try {
        return step(iter.next());
      } catch(e) {
        return Promise.reject(e);
      }
    };
  };
  
  async.proc = function(gen) {
    var f = async(gen);
    return function() {
      f.apply(this, arguments).done();
    };
  };
  
  return async;
});