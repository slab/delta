var Delta = require('../../lib/delta');
var expect = require('chai').expect;


describe('constructor', function () {
  var ops = [
    { insert: 'abc' },
    { retain: 1, formats: { color: 'red' } },
    { delete: 4 },
    { insert: 'def', formats: { bold: true } },
    { retain: 6 }
  ];

  it('empty', function () {
    var delta = new Delta();
    expect(delta).to.exist;
    expect(delta.ops).to.exist;
    expect(delta.ops.length).to.equal(0);
  });

  it('empty ops', function () {
    var delta = new Delta().insert('').delete(0).retain(0);
    expect(delta).to.exist;
    expect(delta.ops).to.exist;
    expect(delta.ops.length).to.equal(0);
  });

  it('array of ops', function () {
    var delta = new Delta([
      'abc',
      { retain: 1, formats: { color: 'red' } },
      -4,
      { insert: 'def', formats: { bold: true } },
      5,
      { retain: 1 }
    ]);
    expect(delta.ops).to.deep.equal(ops);
  });

  it('delta in object form', function () {
    var delta = new Delta({ ops: ops });
    expect(delta.ops).to.deep.equal(ops);
  });

  it('delta', function () {
    var original = new Delta(ops);
    var delta = new Delta(original);
    expect(delta.ops).to.deep.equal(original.ops);
    expect(delta.ops).to.deep.equal(ops);
  });
});

describe('insert', function () {
  it('insert(text)', function () {
    var delta = new Delta().insert('test');
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ insert: 'test' });
  });

  it('insert(embed)', function () {
    var obj = { url: 'http://quilljs.com', alt: 'Quill' };
    var delta = new Delta().insert(obj);
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ formats: obj });
  });

  it('insert(text, attributes)', function () {
    var delta = new Delta().insert('test', { bold: true });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ insert: 'test', formats: { bold: true } });
  });

  it('insert(null, attributes)', function () {
    var obj = { url: 'http://quilljs.com', alt: 'Quill' };
    var delta = new Delta().insert(null, obj);
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ formats: obj });
  });
});

describe('delete', function () {
  it('delete(0)', function () {
    var delta = new Delta().delete(0);
    expect(delta.ops.length).to.equal(0);
  });

  it('delete(negative)', function () {
    var delta = new Delta().delete(-1);
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ delete: 1 });
  });

  it('delete(positive)', function () {
    var delta = new Delta().delete(1);
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ delete: 1 });
  });
});

describe('retain', function () {
  it('retain(0)', function () {
    var delta = new Delta().retain(0);
    expect(delta.ops.length).to.equal(0);
  });

  it('retain(length)', function () {
    var delta = new Delta().retain(2);
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ retain: 2 });
  });

  it('retain(length, attributes)', function () {
    var delta = new Delta().retain(1, { bold: true });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ retain: 1, formats: { bold: true } });
  });
});

describe('_push', function () {
  it('_push(op) into empty', function () {
    var delta = new Delta();
    delta._push({ insert: 'test' });
    expect(delta.ops.length).to.equal(1);
  });

  it('_push(op) consecutive delete', function () {
    var delta = new Delta().delete(-2);
    delta._push({ delete: 3 });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ delete: 5 });
  });

  it('_push(op) consecutive text', function () {
    var delta = new Delta().insert('a');
    delta._push({ insert: 'b' });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ insert: 'ab' });
  });

  it('_push(op) consecutive texts with matching attributes', function () {
    var delta = new Delta().insert('a', { bold: true });
    delta._push({ insert: 'b', formats: { bold: true } });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ insert: 'ab', formats: { bold: true } });
  });

  it('_push(op) consecutive retains with matching attributes', function () {
    var delta = new Delta().retain(1, { bold: true });
    delta._push({ retain: 3, formats: { bold : true } });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ retain: 4, formats: { bold: true } });
  });

  it('_push(op) consecutive texts with mismatched attributes', function () {
    var delta = new Delta().insert('a', { bold: true });
    delta._push({ insert: 'b' });
    expect(delta.ops.length).to.equal(2);
  });

  it('_push(op) consecutive retains with mismatched attributes', function () {
    var delta = new Delta().retain(1, { bold: true });
    delta._push({ retain: 3 });
    expect(delta.ops.length).to.equal(2);
  });

  it('_push(op) consecutive embeds with matching attributes', function () {
    var delta = new Delta().insert({ url: 'http://quilljs.com' });
    delta._push({ formats: { url: 'http://quilljs.com' } });
    expect(delta.ops.length).to.equal(2);
  });
});
