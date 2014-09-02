var op = require('../lib/op');
var expect = require('chai').expect;


describe('op', function() {
  describe('composeFormats', function() {
    var format = { bold: true, color: 'red' };
    it('left is undefined', function() {
      expect(op.composeFormats(undefined, format)).to.deep.equal(format);
    });

    it('right is undefined', function() {
      expect(op.composeFormats(format, undefined)).to.deep.equal(format);
    });

    it('both are undefined', function() {
      expect(op.composeFormats(undefined, undefined)).to.deep.equal(undefined);
    });

    it('missing', function() {
      expect(op.composeFormats(format, { italic: true })).to.deep.equal({
        bold: true,
        italic: true,
        color: 'red'
      });
    });

    it('overwrite', function() {
      expect(op.composeFormats(format, { bold: false, color: 'blue' })).to.deep.equal({
        bold: false,
        color: 'blue'
      });
    });

    it('remove', function() {
      expect(op.composeFormats(format, { bold: null })).to.deep.equal({
        color: 'red'
      });
    });
  });

  describe('length', function() {
    it('delete', function() {
      expect(op.length({ delete: 5 })).to.equal(5);
    });

    it('retain', function() {
      expect(op.length({ retain: 2 })).to.equal(2);
    });

    it('insert text', function() {
      expect(op.length({ insert: 'text' })).to.equal(4);
    });

    it('insert embed', function() {
      expect(op.length({})).to.equal(1);
    });
  });

  describe('iterator', function() {

  });
});
