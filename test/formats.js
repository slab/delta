var op = require('../lib/op');
var expect = require('chai').expect;


describe('format', function () {
  describe('clone', function () {
    var formats = {
      bold: true,
      color: 'red',
      italic: null
    };

    it('undefined', function () {
      expect(op.format.clone(undefined)).to.deep.equal({});
    });

    it('keep null', function () {
      var clone = op.format.clone(formats, true);
      expect(clone === formats).to.equal(false);
      expect(clone).to.deep.equal(formats);
    });

    it('dont keep null', function () {
      var clone = op.format.clone(formats, false);
      expect(clone === formats).to.equal(false);
      expect(clone).to.deep.equal({
        bold: true,
        color: 'red'
      });
    });
  });

  describe('compose', function () {
    var format = { bold: true, color: 'red' };

    it('left is undefined', function () {
      expect(op.format.compose(undefined, format)).to.deep.equal(format);
    });

    it('right is undefined', function () {
      expect(op.format.compose(format, undefined)).to.deep.equal(format);
    });

    it('both are undefined', function () {
      expect(op.format.compose(undefined, undefined)).to.equal(undefined);
    });

    it('missing', function () {
      expect(op.format.compose(format, { italic: true })).to.deep.equal({
        bold: true,
        italic: true,
        color: 'red'
      });
    });

    it('overwrite', function () {
      expect(op.format.compose(format, { bold: false, color: 'blue' })).to.deep.equal({
        bold: false,
        color: 'blue'
      });
    });

    it('remove', function () {
      expect(op.format.compose(format, { bold: null })).to.deep.equal({
        color: 'red'
      });
    });

    it('remove to none', function () {
      expect(op.format.compose(format, { bold: null, color: null })).to.equal(undefined);
    });

    it('remove missing', function () {
      expect(op.format.compose(format, { italic: null })).to.deep.equal(format);
    });
  });

  describe('transform', function () {
    var leftFormat = { bold: true, color: 'red', font: null };
    var rightFormat = { color: 'blue', font: 'serif', italic: true };

    it('left is undefined', function () {
      expect(op.format.transform(undefined, leftFormat, false)).to.deep.equal(leftFormat);
    });

    it('right is undefined', function () {
      expect(op.format.transform(leftFormat, undefined, false)).to.equal(undefined);
    });

    it('both are undefined', function () {
      expect(op.format.transform(undefined, undefined, false)).to.equal(undefined);
    });

    it('with priority', function () {
      expect(op.format.transform(leftFormat, rightFormat, true)).to.deep.equal({
        italic: true
      });
    });

    it('without priority', function () {
      expect(op.format.transform(leftFormat, rightFormat, false)).to.deep.equal(rightFormat);
    });
  });
});
