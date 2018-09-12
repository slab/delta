var AttributeMap = require("../dist/Delta").AttributeMap;

describe("AttributeMap", function() {
  describe("compose()", function() {
    var attributes = { bold: true, color: "red" };

    it("left is undefined", function() {
      expect(
        AttributeMap.compose(
          undefined,
          attributes
        )
      ).toEqual(attributes);
    });

    it("right is undefined", function() {
      expect(
        AttributeMap.compose(
          attributes,
          undefined
        )
      ).toEqual(attributes);
    });

    it("both are undefined", function() {
      expect(
        AttributeMap.compose(
          undefined,
          undefined
        )
      ).toBe(undefined);
    });

    it("missing", function() {
      expect(
        AttributeMap.compose(
          attributes,
          { italic: true }
        )
      ).toEqual({
        bold: true,
        italic: true,
        color: "red"
      });
    });

    it("overwrite", function() {
      expect(
        AttributeMap.compose(
          attributes,
          { bold: false, color: "blue" }
        )
      ).toEqual({
        bold: false,
        color: "blue"
      });
    });

    it("remove", function() {
      expect(
        AttributeMap.compose(
          attributes,
          { bold: null }
        )
      ).toEqual({
        color: "red"
      });
    });

    it("remove to none", function() {
      expect(
        AttributeMap.compose(
          attributes,
          { bold: null, color: null }
        )
      ).toEqual(undefined);
    });

    it("remove missing", function() {
      expect(
        AttributeMap.compose(
          attributes,
          { italic: null }
        )
      ).toEqual(attributes);
    });
  });

  describe("diff()", function() {
    var format = { bold: true, color: "red" };

    it("left is undefined", function() {
      expect(AttributeMap.diff(undefined, format)).toEqual(format);
    });

    it("right is undefined", function() {
      var expected = { bold: null, color: null };
      expect(AttributeMap.diff(format, undefined)).toEqual(expected);
    });

    it("same format", function() {
      expect(AttributeMap.diff(format, format)).toEqual(undefined);
    });

    it("add format", function() {
      var added = { bold: true, italic: true, color: "red" };
      var expected = { italic: true };
      expect(AttributeMap.diff(format, added)).toEqual(expected);
    });

    it("remove format", function() {
      var removed = { bold: true };
      var expected = { color: null };
      expect(AttributeMap.diff(format, removed)).toEqual(expected);
    });

    it("overwrite format", function() {
      var overwritten = { bold: true, color: "blue" };
      var expected = { color: "blue" };
      expect(AttributeMap.diff(format, overwritten)).toEqual(expected);
    });
  });

  describe("transform()", function() {
    var left = { bold: true, color: "red", font: null };
    var right = { color: "blue", font: "serif", italic: true };

    it("left is undefined", function() {
      expect(AttributeMap.transform(undefined, left, false)).toEqual(left);
    });

    it("right is undefined", function() {
      expect(AttributeMap.transform(left, undefined, false)).toEqual(
        undefined
      );
    });

    it("both are undefined", function() {
      expect(AttributeMap.transform(undefined, undefined, false)).toEqual(
        undefined
      );
    });

    it("with priority", function() {
      expect(AttributeMap.transform(left, right, true)).toEqual({
        italic: true
      });
    });

    it("without priority", function() {
      expect(AttributeMap.transform(left, right, false)).toEqual(right);
    });
  });
});
