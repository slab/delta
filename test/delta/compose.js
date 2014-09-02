var Delta = require('../../lib/delta');
var expect = require('chai').expect;


describe('compose', function() {
  describe('single ops', function() {
    it('insert + insert', function() {
      var a = new Delta().insert('A');
      var b = new Delta().insert('B');
      var expected = new Delta().insert('B').insert('A');
      expect(a.compose(b)).to.deep.equal(expected);
    });

    it('insert + retain', function() {
      var a = new Delta().insert('A');
      var b = new Delta().retain(1, { bold: true, color: 'red' });
      var expected = new Delta().insert('A', { bold: true, color: 'red' });
      expect(a.compose(b)).to.deep.equal(expected);
    });

    it('insert + delete', function() {
      var a = new Delta().insert('A');
      var b = new Delta().delete(-1);
      var expected = new Delta();
      expect(a.compose(b)).to.deep.equal(expected);
    });

    it('delete + insert', function() {
      var a = new Delta().delete(-1);
      var b = new Delta().insert('B');
      var expected = new Delta().insert('B').delete(-1);
      expect(a.compose(b)).to.deep.equal(expected);
    });

    it('delete + retain', function() {
      var a = new Delta().delete(-1);
      var b = new Delta().retain(1, { bold: true, color: 'red' });
      var expected = new Delta().delete(-1).retain(1, { bold: true, color: 'red' });
      expect(a.compose(b)).to.deep.equal(expected);
    });

    it('delete + delete', function() {
      var a = new Delta().delete(-1).retain(1);  // Need end length to be 1 to apply another delete
      var b = new Delta().delete(-1);
      var expected = new Delta().delete(-1).delete(-1);
      expect(a.compose(b)).to.deep.equal(expected);
    });

    it('retain + insert', function() {
      var a = new Delta().retain(1, { color: 'blue' });
      var b = new Delta().insert('B');
      var expected = new Delta().insert('B').retain(1, { color: 'blue' });
      expect(a.compose(b)).to.deep.equal(expected);
    });

    it('retain + retain', function() {
      var a = new Delta().retain(1, { color: 'blue' });
      var b = new Delta().retain(1, { bold: true, color: 'red' });
      var expected = new Delta().retain(1, { bold: true, color: 'red' });
      expect(a.compose(b)).to.deep.equal(expected);
    });

    it('retain + delete', function() {
      var a = new Delta().retain(1, { color: 'blue' });
      var b = new Delta().delete(-1);
      var expected = new Delta().delete(-1);
      expect(a.compose(b)).to.deep.equal(expected);
    });
  });
});
