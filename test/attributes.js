var op = require('../lib/op');
var expect = require('chai').expect;


describe('attributes', function () {
  describe('clone', function () {
    var attributes = {
      bold: true,
      color: 'red',
      italic: null
    };

    it('undefined', function () {
      expect(op.attributes.clone(undefined)).to.deep.equal({});
    });

    it('keep null', function () {
      var clone = op.attributes.clone(attributes, true);
      expect(clone === attributes).to.equal(false);
      expect(clone).to.deep.equal(attributes);
    });

    it('dont keep null', function () {
      var clone = op.attributes.clone(attributes, false);
      expect(clone === attributes).to.equal(false);
      expect(clone).to.deep.equal({
        bold: true,
        color: 'red'
      });
    });
  });

  describe('compose', function () {
    var attributes = { bold: true, color: 'red' };

    it('left is undefined', function () {
      expect(op.attributes.compose(undefined, attributes)).to.deep.equal(attributes);
    });

    it('right is undefined', function () {
      expect(op.attributes.compose(attributes, undefined)).to.deep.equal(attributes);
    });

    it('both are undefined', function () {
      expect(op.attributes.compose(undefined, undefined)).to.equal(undefined);
    });

    it('missing', function () {
      expect(op.attributes.compose(attributes, { italic: true })).to.deep.equal({
        bold: true,
        italic: true,
        color: 'red'
      });
    });

    it('overwrite', function () {
      expect(op.attributes.compose(attributes, { bold: false, color: 'blue' })).to.deep.equal({
        bold: false,
        color: 'blue'
      });
    });

    it('remove', function () {
      expect(op.attributes.compose(attributes, { bold: null })).to.deep.equal({
        color: 'red'
      });
    });

    it('remove to none', function () {
      expect(op.attributes.compose(attributes, { bold: null, color: null })).to.equal(undefined);
    });

    it('remove missing', function () {
      expect(op.attributes.compose(attributes, { italic: null })).to.deep.equal(attributes);
    });
  });

  describe('transform', function () {
    var left = { bold: true, color: 'red', font: null };
    var right = { color: 'blue', font: 'serif', italic: true };

    it('left is undefined', function () {
      expect(op.attributes.transform(undefined, left, false)).to.deep.equal(left);
    });

    it('right is undefined', function () {
      expect(op.attributes.transform(left, undefined, false)).to.equal(undefined);
    });

    it('both are undefined', function () {
      expect(op.attributes.transform(undefined, undefined, false)).to.equal(undefined);
    });

    it('with priority', function () {
      expect(op.attributes.transform(left, right, true)).to.deep.equal({
        italic: true
      });
    });

    it('without priority', function () {
      expect(op.attributes.transform(left, right, false)).to.deep.equal(right);
    });
  });
});
