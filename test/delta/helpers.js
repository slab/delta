var Delta = require('../../lib/delta');
var expect = require('chai').expect;


describe('helpers', function () {
  it('_chop() retain', function () {
    var delta = new Delta().insert('Test').retain(4);
    var expected = new Delta().insert('Test');
    expect(delta._chop()).to.deep.equal(expected);
  });

  it('_chop() insert', function () {
    var delta = new Delta().insert('Test');
    var expected = new Delta().insert('Test');
    expect(delta._chop()).to.deep.equal(expected);
  });

  it('_chop() formatted retain', function () {
    var delta = new Delta().insert('Test').retain(4, { bold: true });
    var expected = new Delta().insert('Test').retain(4, { bold: true });
    expect(delta._chop()).to.deep.equal(expected);
  })
});
