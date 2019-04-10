var Delta = require('../../dist/Delta');

describe('invert()', function() {
  it('insert', function() {
    var delta = new Delta().retain(2).insert('A');
    var base = new Delta().insert('123456');
    var expected = new Delta().retain(2).delete(1);
    var inverted = delta.invert(base);
    expect(expected).toEqual(inverted);
    expect(base.compose(delta).compose(inverted)).toEqual(base);
  });

  it('delete', function() {
    var delta = new Delta().retain(2).delete(3);
    var base = new Delta().insert('123456');
    var expected = new Delta().retain(2).insert('345');
    var inverted = delta.invert(base);
    expect(expected).toEqual(inverted);
    expect(base.compose(delta).compose(inverted)).toEqual(base);
  });

  it('retain', function() {
    var delta = new Delta().retain(2).retain(3, { bold: true });
    var base = new Delta().insert('123456');
    var expected = new Delta().retain(2).retain(3, { bold: null });
    var inverted = delta.invert(base);
    expect(expected).toEqual(inverted);
    expect(base.compose(delta).compose(inverted)).toEqual(base);
  });

  it('retain on a delta with different attributes', function() {
    var base = new Delta().insert('123').insert('4', { bold: true });
    var delta = new Delta().retain(4, { italic: true });
    var expected = new Delta().retain(4, { italic: null });
    var inverted = delta.invert(base);
    expect(expected).toEqual(inverted);
    expect(base.compose(delta).compose(inverted)).toEqual(base);
  });

  it('combined', function() {
    var delta = new Delta()
      .retain(2)
      .delete(2)
      .insert('AB', { italic: true })
      .retain(2, { italic: null, bold: true })
      .retain(2, { color: 'red' })
      .delete(1);
    var base = new Delta()
      .insert('123', { bold: true })
      .insert('456', { italic: true })
      .insert('789', { color: 'red', bold: true });
    var expected = new Delta()
      .retain(2)
      .insert('3', { bold: true })
      .insert('4', { italic: true })
      .delete(2)
      .retain(2, { italic: true, bold: null })
      .retain(2)
      .insert('9', { color: 'red', bold: true });
    var inverted = delta.invert(base);
    expect(expected).toEqual(inverted);
    expect(base.compose(delta).compose(inverted)).toEqual(base);
  });
});
