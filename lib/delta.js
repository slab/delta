var is = require('./is');
var op = require('./op');


var Delta = function (ops) {
  this.ops = [];
  if (is.array(ops)) {
    ops.forEach((function (nextOp) {
      if (is.string(nextOp)) {
        this.insert(nextOp);
      } else if (is.number(nextOp)) {
        if (nextOp > 0) {
          this.retain(nextOp);
        } else {
          this['delete'](nextOp);
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


Delta.prototype.insert = function (text, formats) {
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

Delta.prototype['delete'] = function (length) {
  if (length === 0) return this;
  return this._push({ 'delete': Math.abs(length) });
};

Delta.prototype.retain = function (length, formats) {
  if (length === 0) return this;
  var newOp = { retain: length };
  if (is.object(formats)) newOp.formats = formats;
  return this._push(newOp);
};

Delta.prototype._chop = function () {
  var lastOp = this.ops[this.ops.length - 1];
  if (lastOp && lastOp.retain && !lastOp.formats) {
    this.ops.pop();
  }
  return this;
};

Delta.prototype._push = function (newOp) {
  var lastOp = this.ops[this.ops.length - 1];
  if (is.object(lastOp)) {
    if (is.number(newOp['delete']) && is.number(lastOp['delete'])) {
      lastOp['delete'] += newOp['delete'];
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


Delta.prototype.compose = function (other) {
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
      if (is.number(otherOp.retain)) {
        var newOp = {};
        if (is.number(thisOp.retain)) {
          newOp.retain = length;
        } else if (is.string(thisOp.insert)) {
          newOp.insert = thisOp.insert;
        }
        // Avoid being assigned null or undefined
        if (is.object(thisOp.formats) || is.object(otherOp.formats)) {
          newOp.formats = op.format.compose(thisOp.formats, otherOp.formats);
        }
        this._push(newOp);
      // Other op should be delete, we could be an insert or retain
      // Insert + delete cancels out
      } else if (is.number(otherOp['delete']) && is.number(thisOp.retain)) {
        this._push(otherOp);
      }
    }
  }
  return this._chop();
};

Delta.prototype.transform = function (other, priority) {
  priority = priority ? true : false;
  var thisIter = op.iterator(this.ops);
  var otherIter = op.iterator(other.ops);
  this.ops = [];
  while (thisIter.hasNext() || otherIter.hasNext()) {
    if (thisIter.peekType() === 'insert' && (priority || otherIter.peekType() !== 'insert')) {
      this.retain(op.length(thisIter.next()));
    } else if (otherIter.peekType() === 'insert') {
      this._push(otherIter.next());
    } else {
      var length = Math.min(thisIter.peekLength(), otherIter.peekLength());
      var thisOp = thisIter.next(length);
      var otherOp = otherIter.next(length);
      if (thisOp.delete) {
        // Our delete either makes their delete redundant or removes their retain
        continue;
      } else if (otherOp.delete) {
        this._push(otherOp);
      } else {
        // We are both retains
        this.retain(length, otherOp.formats);
      }
    }
  }
  return this._chop();
};


module.exports = Delta;
