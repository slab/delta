var Delta = require('../lib/delta');
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
    beforeEach(function() {
      this.delta = new Delta().insert('Hello', { bold: true }).retain(3).delete(-4).insert({ src: 'http://quilljs.com/' });
    });

    it('hasNext() true', function() {
      var iter = op.iterator(this.delta.ops);
      expect(iter.hasNext()).to.equal(true);
    });

    it('hasNext() false', function() {
      var iter = op.iterator([]);
      expect(iter.hasNext()).to.equal(false);
    });

    it('peekLength() offset === 0', function() {
      var iter = op.iterator(this.delta.ops);
      expect(iter.peekLength()).to.equal(5);
      iter.next();
      expect(iter.peekLength()).to.equal(3);
      iter.next();
      expect(iter.peekLength()).to.equal(4);
    });

    it('peekLength() offset > 0', function() {
      var iter = op.iterator(this.delta.ops);
      iter.next(2);
      expect(iter.peekLength()).to.equal(5 - 2);
    });

    it('peekLength() no ops left', function() {
      var iter = op.iterator([]);
      expect(iter.peekLength()).to.equal(Infinity);
    });

    it('peekType()', function() {
      var iter = op.iterator(this.delta.ops);
      expect(iter.peekType()).to.equal('insert');
      iter.next();
      expect(iter.peekType()).to.equal('retain');
      iter.next();
      expect(iter.peekType()).to.equal('delete');
      iter.next();
      expect(iter.peekType()).to.equal('insert');
      iter.next();
      expect(iter.peekType()).to.equal('retain');
    });

    it('next()', function() {
      var iter = op.iterator(this.delta.ops);
      for (var i = 0; i < this.delta.ops.length; i += 1) {
        expect(iter.next()).to.deep.equal(this.delta.ops[i]);
      }
      expect(iter.next()).to.deep.equal({ retain: Infinity });
      // Rerun to test multiple past end next calls
      expect(iter.next()).to.deep.equal({ retain: Infinity });
    });

    it('next(length)', function() {
      var iter = op.iterator(this.delta.ops);
      expect(iter.next(2)).to.deep.equal({ insert: 'He', formats: { bold: true }});
      expect(iter.next(10)).to.deep.equal({ insert: 'llo', formats: { bold: true }});
      expect(iter.next(1)).to.deep.equal({ retain: 1 });
      expect(iter.next(2)).to.deep.equal({ retain: 2 });
    });
  });
});
