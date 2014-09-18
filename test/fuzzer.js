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


var generateRandomFormat = function (includeNull) {
  var format = {};
  for (var key in FORMATS) {
    if (fuzzer.randomReal() < 0.5) {
      var value = FORMATS[key][fuzzer.randomInt(FORMATS[key].length)];
      if (value || includeNull) {
        format[key] = value;
      }
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

  var base = length > 100 ? 8 : 6; // Favor deleting on long documents
  var delta = new Delta();
  do {
    // Allows insert/delete to occur at the end (deletes will be noop)
    var index = fuzzer.randomInt(Math.min(length, 5) + 1);
    var modLength = Math.min(length, fuzzer.randomInt(4) + 1);
    length -= index;
    delta.retain(index);
    switch (fuzzer.randomInt(base)) {
      case 0:
        delta.insert(fuzzer.randomWord());
        break;
      case 1:
        delta.insert(fuzzer.randomWord(), generateRandomFormat(false));
        break;
      case 2: case 3:
        delta.retain(modLength, generateRandomFormat(true));
        length -= modLength;
        break;
      default:
        delta.delete(modLength);
        length -= modLength;
        break;
    }
  } while (length > 0 && fuzzer.randomInt(2) > 0);

  var composed = snapshot.compose(delta);
  return [delta.ops, composed.ops];
};


fuzzer(richType, generateRandomOp);
