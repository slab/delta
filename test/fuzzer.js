var Delta = require('quill-delta');
var fuzzer = require('ot-fuzzer');
var richType = require('../lib/rich-text');


var generateRandomOp = function (snapshot) {
  var delta = new Delta().insert('Test');
  var snapshot = new Delta(snapshot);
  var composed = snapshot.compose(delta);
  return [delta.ops, composed.ops];
};

fuzzer(richType, generateRandomOp);
