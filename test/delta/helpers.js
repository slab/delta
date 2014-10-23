var Delta = require('../../lib/delta');
var expect = require('chai').expect;


describe('helpers', function () {
  describe('chop()', function () {
    it('retain', function () {
      var delta = new Delta().insert('Test').retain(4);
      var expected = new Delta().insert('Test');
      expect(delta.chop()).to.deep.equal(expected);
    });

    it('insert', function () {
      var delta = new Delta().insert('Test');
      var expected = new Delta().insert('Test');
      expect(delta.chop()).to.deep.equal(expected);
    });

    it('formatted retain', function () {
      var delta = new Delta().insert('Test').retain(4, { bold: true });
      var expected = new Delta().insert('Test').retain(4, { bold: true });
      expect(delta.chop()).to.deep.equal(expected);
    })
  });

  describe('length()', function () {
    it('document', function () {
      var delta = new Delta().insert('AB', { bold: true }).insert(1);
      expect(delta.length()).to.equal(3);
    });

    it('mixed', function () {
      var delta = new Delta().insert('AB', { bold: true }).insert(1).retain(2, { bold: null }).delete(1);
      expect(delta.length()).to.equal(6);
    });
  });

  describe('slice()', function () {
    it('start', function () {
      var slice = new Delta().retain(2).insert('A').slice(2);
      var expected = new Delta().insert('A');
      expect(slice).to.deep.equal(expected);
    });

    it('start and end chop', function () {
      var slice = new Delta().insert('0123456789').slice(2, 7);
      var expected = new Delta().insert('23456');
      expect(slice).to.deep.equal(expected);
    });

    it('start and end multiple chop', function () {
      var slice = new Delta().insert('0123', { bold: true }).insert('4567').slice(3, 5);
      var expected = new Delta().insert('3', { bold: true }).insert('4');
      expect(slice).to.deep.equal(expected);
    });

    it('start and end', function () {
      var slice = new Delta().retain(2).insert('A', { bold: true }).insert('B').slice(2, 3);
      var expected = new Delta().insert('A', { bold: true });
      expect(slice).to.deep.equal(expected);
    });

    it('no params', function () {
      var delta = new Delta().retain(2).insert('A', { bold: true }).insert('B');
      var slice = delta.slice();
      expect(slice).to.deep.equal(delta);
    });

    it('split ops', function () {
      var slice = new Delta().insert('AB', { bold: true }).insert('C').slice(1, 2);
      var expected = new Delta().insert('B', { bold: true });
      expect(slice).to.deep.equal(expected);
    });

    it('split ops multiple times', function () {
      var slice = new Delta().insert('ABC', { bold: true }).insert('D').slice(1, 2);
      var expected = new Delta().insert('B', { bold: true });
      expect(slice).to.deep.equal(expected);
    });
  });
});
