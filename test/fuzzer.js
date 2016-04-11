var _ = require('lodash');
var expect = require('chai').expect;
var fuzzer = require('ot-fuzzer');
var richText = require('../lib/type');
var Delta = richText.Delta;

var FORMATS = {
  color: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', null],
  font: ['serif', 'sans-serif', 'monospace', null],
  bold: [true, null],
  italic: [true, null]
};

function generateRandomEmbed () {
  switch(fuzzer.randomInt(4)) {
    case 0: return 1;
    case 1: return 2;
    case 2: return { image: 'http://quilljs.com' };
    case 3: return { url: 'http://quilljs.com' };
  }
};

function generateRandomFormat (includeNull) {
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

function generateRandomOp (snapshot) {
  snapshot = _.cloneDeep(snapshot);
  var length = snapshot.ops.reduce(function(length, op) {
    if (!op.insert) {
      console.error(snapshot);
      throw new Error('Snapshot should only have inserts');
    }
    // Snapshot should only have inserts
    return length + (_.isString(op.insert) ? op.insert.length : 1);
  }, 0);

  var base = length > 100 ? 10 : 7; // Favor deleting on long documents
  var delta = new Delta();
  var result = new Delta();

  do {
    // Allows insert/delete to occur at the end (deletes will be noop)
    var modIndex = fuzzer.randomInt(Math.min(length, 5) + 1);
    length -= modIndex;
    var modLength = Math.min(length, fuzzer.randomInt(4) + 1);

    delta.retain(modIndex);
    var ops = next(snapshot, modIndex);
    for (var i in ops) {
      result.push(ops[i]);
    }

    switch (fuzzer.randomInt(base)) {
      case 0:
        // Insert plain text
        var word = fuzzer.randomWord();
        delta.insert(word);
        result.insert(word);
        break;
      case 1:
        // Insert formatted text
        var word = fuzzer.randomWord();
        var formats = generateRandomFormat(false);
        delta.insert(word, formats);
        result.insert(word, formats);
        break;
      case 2:
        // Insert embed
        var type = generateRandomEmbed();
        var formats = generateRandomFormat(false);
        delta.insert(type, formats);
        result.insert(type, formats);
        break;
      case 3: case 4:
        var attributes = generateRandomFormat(true);
        delta.retain(modLength, attributes);
        ops = next(snapshot, modLength);
        for (var i in ops) {
          ops[i].attributes = ops[i].attributes || {};
          for (var key in attributes) {
            ops[i].attributes[key] = (attributes[key] === null) ? undefined : attributes[key];
          }
          ops[i].attributes = _.reduce(ops[i].attributes, function (memo, value, key) {
            if (value !== null && value !== undefined) {
              memo[key] = value;
            }
            return memo;
          }, {});
          var newOp = { insert: ops[i].insert };
          if (_.keys(ops[i].attributes).length > 0) newOp.attributes = ops[i].attributes;
          result.push(newOp);
        }
        length -= modLength;
        break;
      default:
        next(snapshot, modLength);
        delta.delete(modLength);
        length -= modLength;
        break;
    }
  } while (length > 0 && fuzzer.randomInt(2) > 0);

  for (var i in snapshot.ops) {
    result.push(snapshot.ops[i]);
  }

  return [delta, result];
};

function next (snapshot, length) {
  var ops = [];
  while (length > 0) {
    var opLength;
    if (_.isString(snapshot.ops[0].insert)) {
      if (length >= snapshot.ops[0].insert.length) {
        opLength = snapshot.ops[0].insert.length;
        ops.push(snapshot.ops.shift());
      } else {
        var insert = snapshot.ops[0].insert.substr(0, length);
        snapshot.ops[0].insert = snapshot.ops[0].insert.substr(insert.length);
        opLength = insert.length;
        var op = { insert: insert };
        if (snapshot.ops[0].attributes) {
          op.attributes = _.clone(snapshot.ops[0].attributes);
        }
        ops.push(op);
      }
    } else {
      ops.push(snapshot.ops.shift());
      opLength = 1;
    }
    length -= opLength;
  }
  return ops;
};

describe('fuzzer', function() {
  it('random operations', function () {
    expect(function () {
      fuzzer(richText.type, generateRandomOp, 100);
    }).to.not.throw(Error);
  });
});
