var is = require('../lib/is');
var expect = require('chai').expect;


describe('is', function () {
  describe('equal()', function () {
    it('exact objects', function () {
      var obj = { a: 1, b: true, c: 'test' };
      expect(is.equal(obj, obj)).to.equal(true);
    });

    it('deep equal objects', function () {
      var obj1 = { a: 1, b: true, c: 'test' };
      var obj2 = { a: 1, c: 'test', b: true };
      expect(is.equal(obj1, obj2)).to.equal(true);
    });

    it('different keys', function () {
      var obj1 = { a: 1, b: true, c: 'test' };
      var obj2 = { a: 1, c: 'test', b: false };
      expect(is.equal(obj1, obj2)).to.equal(false);
    });

    it('missing keys', function () {
      var obj1 = { a: 1, b: true, c: 'test' };
      var obj2 = { a: 1, c: 'test'};
      expect(is.equal(obj1, obj2)).to.equal(false);
    });

    it('null and undefined', function () {
      expect(is.equal(null, undefined)).to.equal(true);
    });

    it('existing with nonexisting', function () {
      expect(is.equal({}, null)).to.equal(false);
    });
  });

  describe('array()', function () {
    it('literal', function () {
      expect(is.array([])).to.equal(true);
    });

    it('instance', function () {
      expect(is.array(new Array())).to.equal(true);
    });

    it('null', function () {
      expect(is.array(null)).to.equal(false);
    });
  });

  describe('number()', function () {
    it('literal', function () {
      expect(is.number(11)).to.equal(true);
    });

    it('object', function () {
      expect(is.number(new Number(0))).to.equal(true);
    });

    it('NaN', function () {
      expect(is.number(NaN)).to.equal(true);

    });

    it('Infinity', function () {
      expect(is.number(Infinity)).to.equal(true);
    });

    it('null', function () {
      expect(is.number(null)).to.equal(false);
    });

    it('wrong type', function () {
      expect(is.number({})).to.equal(false);
    });
  });

  describe('object()', function () {
    it('literal', function () {
      expect(is.object({})).to.equal(true);
    });

    it('instance', function () {
      function obj() {};
      expect(is.object(new obj)).to.equal(true);
    });

    it('string literal', function () {
      expect(is.object('test')).to.equal(false);
    });

    it('string instance', function () {
      expect(is.object(new String('test'))).to.equal(true);
    });

    it('number literal', function () {
      expect(is.object(1)).to.equal(false);
    });

    it('number instance', function () {
      expect(is.object(new Number(1))).to.equal(true);
    });

    it('null', function () {
      expect(is.object(null)).to.equal(false);
    });

    it('function', function () {
      expect(is.object(function () {})).to.equal(true);
    });
  });

  describe('string()', function () {
    it('literal', function () {
      expect(is.string('test')).to.equal(true);
    });

    it('object', function () {
      expect(is.string(new String('test'))).to.equal(true);
    });

    it('null', function () {
      expect(is.string(null)).to.equal(false);
    });

    it('wrong type', function () {
      expect(is.string({})).to.equal(false);
    });
  });
});
