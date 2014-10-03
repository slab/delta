var Delta = require('../lib/delta');
var op = require('../lib/op');
var expect = require('chai').expect;


describe('op', function () {
  describe('length()', function () {
    it('delete', function () {
      expect(op.length({ delete: 5 })).to.equal(5);
    });

    it('retain', function () {
      expect(op.length({ retain: 2 })).to.equal(2);
    });

    it('insert text', function () {
      expect(op.length({ insert: 'text' })).to.equal(4);
    });

    it('insert embed', function () {
      expect(op.length({ insert: 2 })).to.equal(1);
    });
  });

  describe('iterator()', function () {
    beforeEach(function () {
      this.delta = new Delta().insert('Hello', { bold: true }).retain(3).insert(2, { src: 'http://quilljs.com/' }).delete(4);
    });

    it('hasNext() true', function () {
      var iter = op.iterator(this.delta.ops);
      expect(iter.hasNext()).to.equal(true);
    });

    it('hasNext() false', function () {
      var iter = op.iterator([]);
      expect(iter.hasNext()).to.equal(false);
    });

    it('peekLength() offset === 0', function () {
      var iter = op.iterator(this.delta.ops);
      expect(iter.peekLength()).to.equal(5);
      iter.next();
      expect(iter.peekLength()).to.equal(3);
      iter.next();
      expect(iter.peekLength()).to.equal(1);
      iter.next();
      expect(iter.peekLength()).to.equal(4);
    });

    it('peekLength() offset > 0', function () {
      var iter = op.iterator(this.delta.ops);
      iter.next(2);
      expect(iter.peekLength()).to.equal(5 - 2);
    });

    it('peekLength() no ops left', function () {
      var iter = op.iterator([]);
      expect(iter.peekLength()).to.equal(Infinity);
    });

    it('peekType()', function () {
      var iter = op.iterator(this.delta.ops);
      expect(iter.peekType()).to.equal('insert');
      iter.next();
      expect(iter.peekType()).to.equal('retain');
      iter.next();
      expect(iter.peekType()).to.equal('insert');
      iter.next();
      expect(iter.peekType()).to.equal('delete');
      iter.next();
      expect(iter.peekType()).to.equal('retain');
    });

    it('next()', function () {
      var iter = op.iterator(this.delta.ops);
      for (var i = 0; i < this.delta.ops.length; i += 1) {
        expect(iter.next()).to.deep.equal(this.delta.ops[i]);
      }
      expect(iter.next()).to.deep.equal({ retain: Infinity });
      expect(iter.next(4)).to.deep.equal({ retain: Infinity });
      expect(iter.next()).to.deep.equal({ retain: Infinity });
    });

    it('next(length)', function () {
      var iter = op.iterator(this.delta.ops);
      expect(iter.next(2)).to.deep.equal({ insert: 'He', attributes: { bold: true }});
      expect(iter.next(10)).to.deep.equal({ insert: 'llo', attributes: { bold: true }});
      expect(iter.next(1)).to.deep.equal({ retain: 1 });
      expect(iter.next(2)).to.deep.equal({ retain: 2 });
    });
  });
});
