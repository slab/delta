var Delta = require('../../lib/delta');
var expect = require('chai').expect;


describe('transformPosition()', function () {
  it('insert before position', function () {
    var delta = new Delta().insert('A');
    expect(delta.transform(2)).to.equal(3);
  });

  it('insert after position', function () {
    var delta = new Delta().retain(2).insert('A');
    expect(delta.transform(1)).to.equal(1);
  });

  it('insert at position', function () {
    var delta = new Delta().retain(2).insert('A');
    expect(delta.transform(2, true)).to.equal(2);
    expect(delta.transform(2, false)).to.equal(3);
  });

  it('delete before position', function () {
    var delta = new Delta().delete(2);
    expect(delta.transform(4)).to.equal(2);
  });

  it('delete after position', function () {
    var delta = new Delta().retain(4).delete(2);
    expect(delta.transform(2)).to.equal(2);
  });

  it('delete across position', function () {
    var delta = new Delta().retain(1).delete(4);
    expect(delta.transform(2)).to.equal(1);
  });

  it('insert and delete before position', function () {
    var delta = new Delta().retain(2).insert('A').delete(2);
    expect(delta.transform(4)).to.equal(3);
  });

  it('insert before and delete across position', function () {
    var delta = new Delta().retain(2).insert('A').delete(4);
    expect(delta.transform(4)).to.equal(3);
  });

  it('delete before and delete across position', function () {
    var delta = new Delta().delete(1).retain(1).delete(4);
    expect(delta.transform(4)).to.equal(1);
  });
});
