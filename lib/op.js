var is = require('./is');


var lib = {
  format: {
    clone: function (format, keepNull) {
      if (!is.object(format)) return {};
      keepNull = keepNull ? true : false;
      var newFormat = {};
      for (var key in format) {
        if (format[key] !== undefined && (format[key] !== null || keepNull)) {
          newFormat[key] = format[key];
        }
      }
      return newFormat;
    },

    compose: function (a, b) {
      if (!is.object(a)) return b;
      if (!is.object(b)) return a;
      var newFormat = this.clone(b, false);
      for (var key in a) {
        if (a[key] !== undefined && b[key] === undefined) {
          newFormat[key] = a[key];
        }
      }
      return newFormat;
    }
  },

  iterator: function (ops) {
    return new Iterator(ops);
  },

  length: function (op) {
    if (is.number(op['delete'])) {
      return op['delete'];
    } else if (is.number(op.retain)) {
      return op.retain;
    } else {
      return is.string(op.insert) ? op.insert.length : 1;
    }
  }
};


function Iterator(ops) {
  this.ops = ops;
  this.index = 0;
  this.offset = 0;
};

Iterator.prototype.hasNext = function () {
  return this.peekLength() < Infinity;
};

Iterator.prototype.next = function (length) {
  if (!length) length = Infinity;
  var nextOp = this.ops[this.index];
  if (nextOp) {
    var offset = this.offset;
    var opLength = lib.length(nextOp)
    if (length >= opLength - offset) {
      length = opLength - offset;
      this.index += 1;
      this.offset = 0;
    } else {
      this.offset += length;
    }
    if (is.number(nextOp['delete'])) {
      return { 'delete': length };
    } else {
      var retOp = {};
      if (nextOp.formats) {
        retOp.formats = nextOp.formats;
      }
      if (is.number(nextOp.retain)) {
        retOp.retain = length;
      } else if (nextOp.insert) {
        retOp.insert = nextOp.insert.substr(offset, length);
      }
      return retOp;
    }
  } else {
    return { retain: Infinity };
  }
};

Iterator.prototype.peekLength = function () {
  if (this.ops[this.index]) {
    // Should never return 0 if our index is being managed correctly
    return lib.length(this.ops[this.index]) - this.offset;
  } else {
    return Infinity;
  }
};

Iterator.prototype.peekType = function () {
  if (this.ops[this.index]) {
    if (is.number(this.ops[this.index]['delete'])) {
      return 'delete';
    } else if (is.number(this.ops[this.index].retain)) {
      return 'retain';
    } else {
      return 'insert';
    }
  }
  return 'retain';
};


module.exports = lib;
