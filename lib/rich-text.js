var Delta = require('quill-delta');


module.exports = {
  name: 'rich-text',
  uri: 'http://sharejs.org/types/rich-text/v0',

  create: function (initial) {
    var delta = new Delta(initial)
    return delta.ops;
  },

  apply: function (snapshot, ops) {
    snapshot = new Delta(snapshot);
    var delta = new Delta(ops);
    var applied = snapshot.compose(delta);
    return applied.ops;
  },

  compose: function (ops1, ops2) {
    var delta1 = new Delta(ops1);
    var delta2 = new Delta(ops2);
    var composed = delta1.compose(delta2);
    return composed.ops;
  },

  transform: function (ops1, ops2, side) {
    var delta1 = new Delta(ops1);
    var delta2 = new Delta(ops2);
    var transformed = delta1.transform(delta2, side === 'left');
    return transformed.ops;
  }
};
