var Delta = require('../../dist/Delta');

describe('invert()', () => {
  it('insert', () => {
    const delta = new Delta().retain(2).insert('A');
    const base = new Delta().insert('123456');
    const expected = new Delta().retain(2).delete(1);
    const inverted = delta.invert(base);
    expect(expected).toEqual(inverted);
    expect(base.compose(delta).compose(inverted)).toEqual(base);
  });

  it('delete', () => {
    const delta = new Delta().retain(2).delete(3);
    const base = new Delta().insert('123456');
    const expected = new Delta().retain(2).insert('345');
    const inverted = delta.invert(base);
    expect(expected).toEqual(inverted);
    expect(base.compose(delta).compose(inverted)).toEqual(base);
  });

  it('retain', () => {
    const delta = new Delta().retain(2).retain(3, { bold: true });
    const base = new Delta().insert('123456');
    const expected = new Delta().retain(2).retain(3, { bold: null });
    const inverted = delta.invert(base);
    expect(expected).toEqual(inverted);
    expect(base.compose(delta).compose(inverted)).toEqual(base);
  });

  it('retain on a delta with different attributes', () => {
    const base = new Delta().insert('123').insert('4', { bold: true });
    const delta = new Delta().retain(4, { italic: true });
    const expected = new Delta().retain(4, { italic: null });
    const inverted = delta.invert(base);
    expect(expected).toEqual(inverted);
    expect(base.compose(delta).compose(inverted)).toEqual(base);
  });

  it('combined', () => {
    const delta = new Delta()
      .retain(2)
      .delete(2)
      .insert('AB', { italic: true })
      .retain(2, { italic: null, bold: true })
      .retain(2, { color: 'red' })
      .delete(1);
    const base = new Delta()
      .insert('123', { bold: true })
      .insert('456', { italic: true })
      .insert('789', { color: 'red', bold: true });
    const expected = new Delta()
      .retain(2)
      .insert('3', { bold: true })
      .insert('4', { italic: true })
      .delete(2)
      .retain(2, { italic: true, bold: null })
      .retain(2)
      .insert('9', { color: 'red', bold: true });
    const inverted = delta.invert(base);
    expect(expected).toEqual(inverted);
    expect(base.compose(delta).compose(inverted)).toEqual(base);
  });
});
