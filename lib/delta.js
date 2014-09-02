var is = require('./is');
var op = require('./op');


var Delta = function(ops) {
  this.ops = [];
  if (is.array(ops)) {
    ops.forEach((function(nextOp) {
      if (is.string(nextOp)) {
        this.insert(nextOp);
      } else if (is.number(nextOp)) {
        if (nextOp > 0) {
          this.retain(nextOp);
        } else {
          this.delete(nextOp);
        }
      } else {
        this._push(nextOp);
      }
    }).bind(this));
  } else if (is.object(ops) && is.array(ops.ops)) {
    // Assume we are given a well formed delta
    this.ops = ops.ops;
  }
};


Delta.prototype.insert = function(text, formats) {
  var newOp = {};
  if (is.object(text) && !is.object(formats)) {
    formats = text;
    text = null;
  }
  if (is.string(text)) {
    newOp.insert = text;
  }
  if (is.object(formats)) {
    newOp.formats = formats;
  }
  return this._push(newOp);
};

Delta.prototype.delete = function(length) {
  if (length === 0) return this;
  return this._push({ delete: Math.abs(length) });
};

Delta.prototype.retain = function(length, formats) {
  if (length === 0) return this;
  var newOp = { retain: length };
  if (is.object(formats)) newOp.formats = formats;
  return this._push(newOp);
};

Delta.prototype._push = function(newOp) {
  var lastOp = this.ops[this.ops.length - 1];
  if (is.object(lastOp)) {
    if (is.number(newOp.delete) && is.number(lastOp.delete)) {
      lastOp.delete += newOp.delete;
      return this;
    } else {
      if (is.equal(newOp.formats, lastOp.formats)) {
        if (is.string(newOp.insert) && is.string(lastOp.insert)) {
          lastOp.insert += newOp.insert;
          return this;
        } else if (is.number(newOp.retain) && is.number(lastOp.retain)) {
          lastOp.retain += newOp.retain;
          return this;
        }
      }
    }
  }
  this.ops.push(newOp);
  return this;
};


Delta.prototype.compose = function(other) {
  var thisIter = op.iterator(this.ops);
  var otherIter = op.iterator(other.ops);
  this.ops = [];
  while (thisIter.hasNext() || otherIter.hasNext()) {
    if (otherIter.peekType() === 'insert') {
      this._push(otherIter.next());
    } else if (thisIter.peekType() === 'delete') {
      this._push(thisIter.next());
    } else {
      var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
      var thisOp = thisIter.next(length);
      var otherOp = otherIter.next(length);
      if (is.number(otherOp.delete)) {
        if (is.number(thisOp.retain) && otherOp.retain !== Infinity) {
          this._push(otherOp);
        }
      } else {
        // Other op must be a retain
        var newOp = {};
        if (is.number(thisOp.retain)) newOp.retain = thisOp.retain;
        // Embed inserts do not have insert key so cannot check isInsert
        if (is.string(thisOp.insert)) newOp.insert = thisOp.insert;
        if (is.object(thisOp.formats) || is.object(otherOp.formats)) {
          newOp.formats = op.composeFormats(thisOp.formats, otherOp.formats);
        }
        this._push(newOp);
      }
    }
  }
  return this;
};

Delta.prototype.transform = function(other, priority) {

};


module.exports = Delta;
