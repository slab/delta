var Delta = require('../../lib/delta');
var expect = require('chai').expect;


describe('helpers', function () {
  it('chop() retain', function () {
    var delta = new Delta().insert('Test').retain(4);
    var expected = new Delta().insert('Test');
    expect(delta.chop()).to.deep.equal(expected);
  });

  it('chop() insert', function () {
    var delta = new Delta().insert('Test');
    var expected = new Delta().insert('Test');
    expect(delta.chop()).to.deep.equal(expected);
  });

  it('chop() formatted retain', function () {
    var delta = new Delta().insert('Test').retain(4, { bold: true });
    var expected = new Delta().insert('Test').retain(4, { bold: true });
    expect(delta.chop()).to.deep.equal(expected);
  })
});
