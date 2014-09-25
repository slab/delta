var _ = require('lodash');
var fuzzer = require('ot-fuzzer');
var richType = require('../lib/type');
var Delta = richType.Delta;

var FORMATS = {
  color: ['red', 'orange', 'yellow', 'green', 'blue', 'purple', null],
  font: ['serif', 'sans-serif', 'monospace', null],
  bold: [true, null],
  italic: [true, null]
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
  console.log('Generate', _.cloneDeep(snapshot));
  var composed = new Delta(_.cloneDeep(snapshot));
  var length = snapshot.reduce(function(length, op) {
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

    console.log('skip retain', modIndex)
    var ops = next(snapshot, modIndex);
    delta.retain(modIndex);
    for (var i in ops) {
      console.log('pushing', ops[i]);
      result.push(ops[i]);
    }

    switch (fuzzer.randomInt(base)) {
      case 0:
        // Insert plain text
        var word = fuzzer.randomWord();
        console.log('insert', word);
        delta.insert(word);
        result.insert(word);
        break;
      case 1:
        // Insert formatted text
        var word = fuzzer.randomWord();
        var formats = generateRandomFormat(false);
        console.log('insert', word, formats);
        delta.insert(word, formats);
        result.insert(word, _.clone(formats));
        break;
      case 2:
        // Insert embed
        var type = fuzzer.randomInt(2) + 1;
        var formats = generateRandomFormat(false);
        console.log('insert', type, formats);
        delta.insert(type, formats);
        result.insert(type, _.clone(formats));
        break;
      case 3: case 4:
        console.log('retain', modLength, attributes);
        ops = next(snapshot, modLength);
        var attributes = generateRandomFormat(true);
        delta.retain(modLength, attributes);
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
          if (_.keys(ops[i].attributes).length > 0) ops[i].attributes = ops[i].attributes;
          console.log('more pushing', ops[i])
          result.push(ops[i]);
        }
        length -= modLength;
        break;
      default:
        console.log('delete', modLength)
        next(snapshot, modLength);
        delta.delete(modLength);
        length -= modLength;
        break;
    }
  } while (length > 0 && fuzzer.randomInt(2) > 0);

  console.log('retain rest', _.cloneDeep(snapshot));
  for (var i in snapshot) {
    result.push(snapshot[i]);
  }

  console.log("Delta", delta.ops);
  console.log("Result", result.ops);
  console.log("Composed", composed.compose(delta).ops);

  return [delta.ops, result.ops];
};

function next (snapshot, length) {
  console.log('next', _.cloneDeep(snapshot), length);
  var ops = [];
  while (length > 0) {
    var opLength;
    if (_.isString(snapshot[0].insert)) {
      if (length >= snapshot[0].insert.length) {
        opLength = snapshot[0].insert.length;
        ops.push(snapshot.shift());
      } else {
        var insert = snapshot[0].insert.substr(0, length);
        snapshot[0].insert = snapshot[0].insert.substr(insert.length);
        opLength = insert.length;
        var op = { insert: insert };
        if (snapshot[0].attributes) {
          op.attributes = snapshot[0].attributes;
        }
        ops.push(op);
      }
    } else {
      ops.push(snapshot.shift());
      opLength = 1;
    }
    length -= opLength;
  }
  console.log('retuing', _.cloneDeep(ops))
  return ops;
};


fuzzer(richType, generateRandomOp);
