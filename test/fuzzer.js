var Delta = require('quill-delta');
var fuzzer = require('ot-fuzzer');
var richType = require('../lib/rich-text');


var generateRandomOp = function (snapshot) {
  var op = new Delta().insert('Test');
  var snapshot = new Delta(snapshot);
  snapshot.insert('Test');
  return [op, snapshot];
};

fuzzer(richType, generateRandomOp);
