var is = require('./is');


var Delta = function(ops) {
  this.ops = [];
  if (is.array(ops)) {
    ops.forEach((function(op) {
      if (is.string(op)) {
        this.insert(op);
      } else if (is.number(op)) {
        if (op > 0) {
          this.retain(op);
        } else {
          this.delete(op);
        }
      } else {
        this._push(op);
      }
    }).bind(this));
  } else if (is.object(ops) && is.array(ops.ops)) {
    // Assume we are given a well formed delta
    this.ops = ops.ops;
  }
};


Delta.prototype.insert = function(text, formats) {
  var op = {};
  if (is.object(text) && !is.object(formats)) {
    formats = text;
    text = null;
  }
  if (is.string(text)) {
    op.insert = text;
  }
  if (is.object(formats)) {
    op.formats = formats;
  }
  return this._push(op);
};

Delta.prototype.delete = function(length) {
  if (length === 0) return this;
  return this._push({ delete: Math.abs(length) });
};

Delta.prototype.retain = function(length, formats) {
  if (length === 0) return this;
  var op = { retain: length };
  if (is.object(formats)) op.formats = formats;
  return this._push(op);
};


Delta.prototype._push = function(op) {
  var lastOp = this.ops[this.ops.length - 1];
  if (is.object(lastOp)) {
    if (is.number(op.delete) && is.number(lastOp.delete)) {
      lastOp.delete += op.delete;
      return this;
    } else {
      if (is.equal(op.formats, lastOp.formats)) {
        if (is.string(op.insert) && is.string(lastOp.insert)) {
          lastOp.insert += op.insert;
          return this;
        } else if (is.number(op.retain) && is.number(lastOp.retain)) {
          lastOp.retain += op.retain;
          return this;
        }
      }
    }
  }
  this.ops.push(op);
  return this;
};


Delta.prototype.compose = function(other) {

};

Delta.prototype.transform = function(other, priority) {

};


module.exports = Delta;
