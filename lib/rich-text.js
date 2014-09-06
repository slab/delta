var Delta = require('quill-delta');


module.exports = {
  name: 'rich-text',
  uri: 'http://sharejs.org/types/rich-text/v0',

  create: function (initial) {
    return new Delta(initial);
  },

  apply: function (snapshot, delta) {
    snapshot = new Delta(snapshot);
    delta = new Delta(delta);
    return snapshot.compose(delta);
  },

  compose: function (delta1, delta2) {
    delta1 = new Delta(delta1);
    return delta1.compose(delta2);
  },

  transform: function (delta1, delta2, side) {
    delta1 = new Delta(delta1);
    return delta1.transform(delta2, side === 'left');
  }
};
