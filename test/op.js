var Delta = require('../dist/Delta');
var Op = require('../dist/Delta').Op;

describe('Op', function() {
  describe('length()', function() {
    it('delete', function() {
      expect(Op.length({ delete: 5 })).toEqual(5);
    });

    it('retain', function() {
      expect(Op.length({ retain: 2 })).toEqual(2);
    });

    it('insert text', function() {
      expect(Op.length({ insert: 'text' })).toEqual(4);
    });

    it('insert embed', function() {
      expect(Op.length({ insert: 2 })).toEqual(1);
    });
  });
});
