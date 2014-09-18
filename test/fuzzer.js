var Delta = require('quill-delta');
Delta.op = require('quill-delta/lib/op');
var fuzzer = require('ot-fuzzer');
var richType = require('../lib/rich-text');

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
    // Snapshot should only have inserts
    return length + (op.insert ? op.insert.length : 1);
  }, 0);

  var base = length > 100 ? 3 : 2; // Favor deleting on long documents
  var delta = new Delta();
  do {
    var random = fuzzer.randomInt(base);
    // Allows insert/delete to occur at the end (deletes will be noop)
    var index = fuzzer.randomInt(Math.min(length, 5) + 1);
    length -= index;
    delta.retain(index);
    if (random === 0) {
      delta.insert(fuzzer.randomWord());
    } else {
      var deleteLength = Math.min(length, fuzzer.randomInt(4) + 1);
      delta.delete(deleteLength);
      length -= deleteLength;
    }
  } while (length > 0 && fuzzer.randomInt(4) > 0);

  var composed = snapshot.compose(delta);
  return [delta.ops, composed.ops];
};


fuzzer(richType, generateRandomOp);
