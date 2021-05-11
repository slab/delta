var Delta = require('../../dist/Delta');

it('detectionId + insert - edit starts before range (should be original functionality)', function () {
  const a1 = new Delta().insert('AB');
  const b1 = new Delta().retain(1).retain(1, { detectionId: '123' });
  const expected1 = new Delta().retain(3).retain(1, { detectionId: '123' });
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta().insert('AB');
  expect(a1.transform(b1)).toEqual(expected1);
  expect(b2.transform(a2)).toEqual(expected2);
});

it('detectionId + insert - edit starts at start of range (should delete)', function () {
  const a1 = new Delta().insert('AB');
  const b1 = new Delta().retain(2, { detectionId: '123' });
  const expected1 = new Delta();
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta().insert('AB').retain(2, { detectionId: null });
  expect(a1.transform(b1)).toEqual(expected1);
  expect(b2.transform(a2)).toEqual(expected2);
});

it('detectionId + insert - edit starts in range and ends in range (should delete)', function () {
  const a1 = new Delta().retain(1).insert('A');
  const b1 = new Delta()
    .retain(3, { detectionId: '123' })
    .retain(4, { detectionId: '234' });
  const expected1 = new Delta().retain(4).retain(4, { detectionId: '234' });
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta()
    .retain(1, { detectionId: null })
    .insert('A')
    .retain(2, { detectionId: null });
  expect(a1.transform(b1, false)).toEqual(expected1);
  expect(b2.transform(a2, false)).toEqual(expected2);
});

it('detectionId + insert - edit starts at the end of range and ends in range (should delete)', function () {
  const a1 = new Delta().retain(1).insert('A');
  const b1 = new Delta()
    .retain(2, { detectionId: '123' })
    .retain(4, { detectionId: '234' });
  const expected1 = new Delta().retain(3).retain(4, { detectionId: '234' });
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta()
    .retain(1, { detectionId: null })
    .insert('A')
    .retain(1, { detectionId: null });
  expect(a1.transform(b1, false)).toEqual(expected1);
  expect(b2.transform(a2, false)).toEqual(expected2);
});

it('detectionId + insert - edit starts and ends after the end of range (should be original functionality)', function () {
  const a1 = new Delta().retain(1).insert('A');
  const b1 = new Delta().retain(1, { detectionId: '123' });
  const expected1 = new Delta().retain(1, { detectionId: '123' });
  const a2 = new Delta(a1);
  1;
  const b2 = new Delta(b1);
  const expected2 = new Delta().retain(1).insert('A');
  expect(a1.transform(b1, false)).toEqual(expected1);
  expect(b2.transform(a2, false)).toEqual(expected2);
});

it('detectionId + delete - edit starts and ends before range (should be original functionality)', function () {
  const a1 = new Delta().delete(1);
  const b1 = new Delta().retain(1).retain(1, { detectionId: '123' });
  const expected1 = new Delta().retain(1, { detectionId: '123' });
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta().delete(1);
  expect(a1.transform(b1)).toEqual(expected1);
  expect(b2.transform(a2)).toEqual(expected2);
});

it('detectionId + delete - edit starts before range but ends in range (should delete)', function () {
  const a1 = new Delta().delete(2);
  const b1 = new Delta().retain(1).retain(3, { detectionId: '123' });
  const expected1 = new Delta();
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta().delete(2).retain(2, { detectionId: null });
  expect(a1.transform(b1)).toEqual(expected1);
  expect(b2.transform(a2)).toEqual(expected2);
});

it('detectionId + delete - edit starts at range start and ends in range (should delete)', function () {
  const a1 = new Delta().delete(1);
  const b1 = new Delta().retain(2, { detectionId: '123' });
  const expected1 = new Delta();
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta().delete(1).retain(1, { detectionId: null });
  expect(a1.transform(b1)).toEqual(expected1);
  expect(b2.transform(a2)).toEqual(expected2);
});

it('detectionId + delete - edit starts in range and ends in range (should delete)', function () {
  const a1 = new Delta().retain(1).delete(2);
  const b1 = new Delta().retain(4, { detectionId: '123' });
  const expected1 = new Delta();
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta()
    .retain(1, { detectionId: null })
    .delete(2)
    .retain(1, { detectionId: null });
  expect(a1.transform(b1)).toEqual(expected1);
  expect(b2.transform(a2)).toEqual(expected2);
});

it('detectionId + delete - edit starts in range and ends outside of range (should delete)', function () {
  const a1 = new Delta().retain(1).delete(5);
  const b1 = new Delta().retain(4, { detectionId: '123' });
  const expected1 = new Delta();
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta().retain(4, { detectionId: null }).delete(5);
  expect(a1.transform(b1)).toEqual(expected1);
  expect(b2.transform(a2)).toEqual(expected2);
});

it('detectionId + delete - edit starts after range but ends in range (should delete)', function () {
  const a1 = new Delta().retain(3).delete(2);
  const b1 = new Delta().retain(3, { detectionId: '123' });
  const expected1 = new Delta();
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta().retain(3, { detectionId: null }).delete(2);
  expect(a1.transform(b1)).toEqual(expected1);
  expect(b2.transform(a2)).toEqual(expected2);
});

it('detectionId + delete - edit starts and ends completely after range (original functionality)', function () {
  const a1 = new Delta().retain(5).delete(2);
  const b1 = new Delta().retain(3, { detectionId: '123' });
  const expected1 = new Delta().retain(3, { detectionId: '123' });
  const a2 = new Delta(a1);
  const b2 = new Delta(b1);
  const expected2 = new Delta().retain(5).delete(2);
  expect(a1.transform(b1)).toEqual(expected1);
  expect(b2.transform(a2)).toEqual(expected2);
});
