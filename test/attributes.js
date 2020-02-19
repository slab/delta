var AttributeMap = require('../dist/Delta').AttributeMap;

describe('AttributeMap', function() {
  describe('compose()', function() {
    var attributes = { bold: true, color: 'red' };

    it('left is undefined', function() {
      expect(
        AttributeMap.compose(
          undefined,
          attributes,
        ),
      ).toEqual(attributes);
    });

    it('right is undefined', function() {
      expect(
        AttributeMap.compose(
          attributes,
          undefined,
        ),
      ).toEqual(attributes);
    });

    it('both are undefined', function() {
      expect(
        AttributeMap.compose(
          undefined,
          undefined,
        ),
      ).toBe(undefined);
    });

    it('missing', function() {
      expect(
        AttributeMap.compose(
          attributes,
          { italic: true },
        ),
      ).toEqual({
        bold: true,
        italic: true,
        color: 'red',
      });
    });

    it('overwrite', function() {
      expect(
        AttributeMap.compose(
          attributes,
          { bold: false, color: 'blue' },
        ),
      ).toEqual({
        bold: false,
        color: 'blue',
      });
    });

    it('remove', function() {
      expect(
        AttributeMap.compose(
          attributes,
          { bold: null },
        ),
      ).toEqual({
        color: 'red',
      });
    });

    it('remove to none', function() {
      expect(
        AttributeMap.compose(
          attributes,
          { bold: null, color: null },
        ),
      ).toEqual(undefined);
    });

    it('remove missing', function() {
      expect(
        AttributeMap.compose(
          attributes,
          { italic: null },
        ),
      ).toEqual(attributes);
    });

    describe('complex attribute', function() {
      it('add a new property', function() {
        expect(
          AttributeMap.compose(
            {complex: {foo: 123}},
            {complex: {bar: 456}},
          ),
        ).toEqual({
          complex: {
            foo: 123,
            bar: 456,
          },
        });
      });

      it('overwrite an existing property', function() {
        expect(
          AttributeMap.compose(
            {complex: {foo: 123}},
            {complex: {foo: 456}},
          ),
        ).toEqual({
          complex: {foo: 456},
        });
      });

      it('remove an existing property', function() {
        expect(
          AttributeMap.compose(
            {complex: {foo: 123, bar: 456}},
            {complex: {foo: null}},
          ),
        ).toEqual({
          complex: {bar: 456},
        });
      });

      it('remove the last property', function() {
        expect(
          AttributeMap.compose(
            {complex: {foo: 123}},
            {complex: {foo: null}},
          ),
        ).toBeUndefined();
      });

      it('overwrites arrays', function() {
        expect(
          AttributeMap.compose(
            {complex: {foo: [1, 2, 3]}},
            {complex: {foo: [1, 3]}},
          ),
        ).toEqual({complex: {foo: [1, 3]}});
      });

      it('deep mix of operations', function() {
        expect(
          AttributeMap.compose(
            {
              complex: {
                foo: {
                  bar: 123,
                  baz: 'abc',
                },
              },
            },
            {
              complex: {
                foo: {
                  bar: 456
                },
                qux: 'def',
              },
            },
          ),
        ).toEqual({
          complex: {
            foo: {
              bar: 456,
              baz: 'abc',
            },
            qux: 'def',
          },
        });
      });
    });
  });

  describe('diff()', function() {
    var format = { bold: true, color: 'red' };

    it('left is undefined', function() {
      expect(AttributeMap.diff(undefined, format)).toEqual(format);
    });

    it('right is undefined', function() {
      var expected = { bold: null, color: null };
      expect(AttributeMap.diff(format, undefined)).toEqual(expected);
    });

    it('same format', function() {
      expect(AttributeMap.diff(format, format)).toEqual(undefined);
    });

    it('add format', function() {
      var added = { bold: true, italic: true, color: 'red' };
      var expected = { italic: true };
      expect(AttributeMap.diff(format, added)).toEqual(expected);
    });

    it('remove format', function() {
      var removed = { bold: true };
      var expected = { color: null };
      expect(AttributeMap.diff(format, removed)).toEqual(expected);
    });

    it('overwrite format', function() {
      var overwritten = { bold: true, color: 'blue' };
      var expected = { color: 'blue' };
      expect(AttributeMap.diff(format, overwritten)).toEqual(expected);
    });

    describe('complex attribute', function () {
      it('same format', function() {
        expect(
          AttributeMap.diff(
            {complex: {foo: 123}},
            {complex: {foo: 123}},
          ),
        ).toBeUndefined();
      });

      it('change the only property', function() {
        expect(
          AttributeMap.diff(
            {complex: {foo: 123}},
            {complex: {foo: 456}},
          ),
        ).toEqual({
          complex: {foo: 456},
        });
      });

      it('change one property but not another', function() {
        expect(
          AttributeMap.diff(
            {complex: {foo: 123, bar: 456}},
            {complex: {foo: 789, bar: 456}},
          ),
        ).toEqual({
          complex: {foo: 789},
        });
      });

      it('add a property', function() {
        expect(
          AttributeMap.diff(
            {complex: {foo: 123}},
            {complex: {foo: 123, bar: 456}},
          ),
        ).toEqual({
          complex: {bar: 456},
        });
      });

      it('remove a property', function() {
        expect(
          AttributeMap.diff(
            {complex: {foo: 123, bar: 456}},
            {complex: {foo: 123}},
          ),
        ).toEqual({
          complex: {bar: null},
        });
      });

      it('array', function() {
        expect(
          AttributeMap.diff(
            {complex: {foo: [1, 2, 3]}},
            {complex: {foo: [1, 3]}},
          ),
        ).toEqual({
          complex: {foo: [1, 3]},
        });
      });
    });
  });

  describe('invert()', function() {
    it('attributes is undefined', function() {
      var base = { bold: true };
      expect(AttributeMap.invert(undefined, base)).toEqual({});
    });

    it('base is undefined', function() {
      var attributes = { bold: true };
      var expected = { bold: null };
      expect(AttributeMap.invert(attributes, undefined)).toEqual(expected);
    });

    it('both undefined', function() {
      expect(AttributeMap.invert()).toEqual({});
    });

    it('merge', function() {
      var attributes = { bold: true };
      var base = { italic: true };
      var expected = { bold: null };
      expect(AttributeMap.invert(attributes, base)).toEqual(expected);
    });

    it('null', function() {
      var attributes = { bold: null };
      var base = { bold: true };
      var expected = { bold: true };
      expect(AttributeMap.invert(attributes, base)).toEqual(expected);
    });

    it('replace', function() {
      var attributes = { color: 'red' };
      var base = { color: 'blue' };
      var expected = base;
      expect(AttributeMap.invert(attributes, base)).toEqual(expected);
    });

    it('noop', function() {
      var attributes = { color: 'red' };
      var base = { color: 'red' };
      var expected = {};
      expect(AttributeMap.invert(attributes, base)).toEqual(expected);
    });

    it('combined', function() {
      var attributes = { bold: true, italic: null, color: 'red', size: '12px' };
      var base = { font: 'serif', italic: true, color: 'blue', size: '12px' };
      var expected = { bold: null, italic: true, color: 'blue' };
      expect(AttributeMap.invert(attributes, base)).toEqual(expected);
    });

    describe('complex attribute', function() {
      it('add property', function() {
        var attributes = {complex: {bar: 456}};
        var base = {complex: {foo: 123}};
        var expected = {complex: {bar: null}};
        expect(AttributeMap.invert(attributes, base)).toEqual(expected);
      });

      it('remove property', function() {
        var attributes = {complex: {bar: null}};
        var base = {complex: {foo: 123, bar: 456}};
        var expected = {complex: {bar: 456}};
        expect(AttributeMap.invert(attributes, base)).toEqual(expected);
      });

      it('update existing property', function() {
        var attributes = {complex: {foo: 789}};
        var base = {complex: {foo: 123, bar: 456}};
        var expected = {complex: {foo: 123}};
        expect(AttributeMap.invert(attributes, base)).toEqual(expected);
      });

      it('array', function() {
        var attributes = {complex: {foo: [1, 3]}};
        var base = {complex: {foo: [1, 2, 3]}};
        var expected = {complex: {foo: [1, 2, 3]}};
        expect(AttributeMap.invert(attributes, base)).toEqual(expected);
      });

      it('deep change', function() {
        var attributes = {complex: {foo: {bar: null}}};
        var base = {complex: {foo: {bar: 123, baz: 456}}};
        var expected = {complex: {foo: {bar: 123}}};
        expect(AttributeMap.invert(attributes, base)).toEqual(expected);
      });
    });
  });

  describe('transform()', function() {
    var left = { bold: true, color: 'red', font: null };
    var right = { color: 'blue', font: 'serif', italic: true };

    it('left is undefined', function() {
      expect(AttributeMap.transform(undefined, left, false)).toEqual(left);
    });

    it('right is undefined', function() {
      expect(AttributeMap.transform(left, undefined, false)).toEqual(undefined);
    });

    it('both are undefined', function() {
      expect(AttributeMap.transform(undefined, undefined, false)).toEqual(
        undefined,
      );
    });

    it('with priority', function() {
      expect(AttributeMap.transform(left, right, true)).toEqual({
        italic: true,
      });
    });

    it('without priority', function() {
      expect(AttributeMap.transform(left, right, false)).toEqual(right);
    });

    describe('complex attribute', function() {
      it('with priority', function() {
        expect(
          AttributeMap.transform(
            {complex: {foo: 123, bar: 456}},
            {complex: {foo: 789, baz: 'abc'}},
            true,
          ),
        ).toEqual({complex: {baz: 'abc'}});
      });

      it('without priority', function () {
        expect(
          AttributeMap.transform(
            {complex: {foo: 123, bar: 456}},
            {complex: {foo: 789, baz: 'abc'}},
            false,
          ),
        ).toEqual({complex: {foo: 789, baz: 'abc'}});
      });

      it('array', function() {
        expect(
          AttributeMap.transform(
            {complex: {foo: [1, 2, 3]}},
            {complex: {foo: [4, 5, 6]}},
          ),
        ).toEqual({complex: {foo: [4, 5, 6]}});
      });
    });
  });
});
