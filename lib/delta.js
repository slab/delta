var Delta = function(ops) {

};

Delta.prototype.delete = function(length) {
  return this;
};

Delta.prototype.insert = function(text, formats) {
  return this;
};

Delta.prototype.retain = function(length, formats) {
  return this;
};


Delta.prototype.compose = function(other) {

};

Delta.prototype.transform = function(other, priority) {

};


module.exports = Delta;
