var Delta = require('quill-delta');
Delta.op = require('quill-delta/lib/op');
var fuzzer = require('ot-fuzzer');
var richType = require('../lib/rich-text');
var _ = require('lodash');

var FORMATS = {
  color: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', null],
  font: ['serif', 'sans-serif', 'monospace', null],
  bold: [true, null],
  italic: [true, null]
};


var generateRandomFormat = function () {
  var format = {};
  for (var key in FORMATS) {
    if (fuzzer.randomReal() < 0.5) {
      format[key] = FORMATS[key][fuzzer.randomInt(FORMATS[key].length)];
    }
  }
  return Object.keys(format).length > 0 ? format : undefined;
};


var generateRandomOp = function (snapshot) {
  var snapshot = new Delta(snapshot);
  var length = snapshot.ops.reduce(function(length, op) {
    return op.insert ? op.insert.length : 1;
  }, 0);

  var delta = new Delta();
  var lastOp = { retain: 1 };
  var change = 0;
  for (var i = 0; i < length; ++i) {
    var random = fuzzer.randomReal();
    if (random < 0.15) {
      lastOp = { retain: 1 };
    } else if (random < 0.30) {
      lastOp = { insert: fuzzer.randomWord() + ' ' };
    } else if (random < 0.45 || (random < 0.9 && length + change > 100)) {
      lastOp = { 'delete': 1 };
    }
    delta._push(_.cloneDeep(lastOp));
    change += Delta.op.length(lastOp);
  }

  if (fuzzer.randomReal() < 0.35) {
    delta.insert(fuzzer.randomWord());
  }

  var composed = snapshot.compose(delta);
  return [delta.ops, composed.ops];
};

fuzzer(richType, generateRandomOp);
