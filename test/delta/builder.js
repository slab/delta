var Delta = require('../../lib/delta');
var expect = require('chai').expect;


describe('constructor', function () {
  var ops = [
    { insert: 'abc' },
    { retain: 1, attributes: { color: 'red' } },
    { delete: 4 },
    { insert: 'def', attributes: { bold: true } },
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
    var delta = new Delta(ops);
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

describe('insert()', function () {
  it('insert(text)', function () {
    var delta = new Delta().insert('test');
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ insert: 'test' });
  });

  it('insert(embed)', function () {
    var delta = new Delta().insert(1);
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ insert: 1 });
  });

  it('insert(embed, attributes)', function () {
    var obj = { url: 'http://quilljs.com', alt: 'Quill' };
    var delta = new Delta().insert(1, obj);
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ insert: 1, attributes: obj });
  });

  it('insert(text, attributes)', function () {
    var delta = new Delta().insert('test', { bold: true });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ insert: 'test', attributes: { bold: true } });
  });

  it('insert(text) after delete', function () {
    var delta = new Delta().delete(1).insert('a');
    var expected = new Delta().insert('a').delete(1);
    expect(delta).to.deep.equal(expected);
  });

  it('insert(text) after delete with merge', function () {
    var delta = new Delta().insert('a').delete(1).insert('b');
    var expected = new Delta().insert('ab').delete(1);
    expect(delta).to.deep.equal(expected);
  });

  it('insert(text) after delete no merge', function () {
    var delta = new Delta().insert(1).delete(1).insert('a');
    var expected = new Delta().insert(1).insert('a').delete(1);
    expect(delta).to.deep.equal(expected);
  });

  it('insert(text, {})', function () {
    var delta = new Delta().insert('a', {});
    var expected = new Delta().insert('a');
    expect(delta).to.deep.equal(expected);
  });
});

describe('delete()', function () {
  it('delete(0)', function () {
    var delta = new Delta().delete(0);
    expect(delta.ops.length).to.equal(0);
  });

  it('delete(positive)', function () {
    var delta = new Delta().delete(1);
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ delete: 1 });
  });
});

describe('retain()', function () {
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
    expect(delta.ops[0]).to.deep.equal({ retain: 1, attributes: { bold: true } });
  });

  it('retain(length, {})', function () {
    var delta = new Delta().retain(2, {}).delete(1);    // Delete prevents chop
    var expected = new Delta().retain(2).delete(1);
    expect(delta).to.deep.equal(expected);
  });
});

describe('push()', function () {
  it('push(op) into empty', function () {
    var delta = new Delta();
    delta.push({ insert: 'test' });
    expect(delta.ops.length).to.equal(1);
  });

  it('push(op) consecutive delete', function () {
    var delta = new Delta().delete(2);
    delta.push({ delete: 3 });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ delete: 5 });
  });

  it('push(op) consecutive text', function () {
    var delta = new Delta().insert('a');
    delta.push({ insert: 'b' });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ insert: 'ab' });
  });

  it('push(op) consecutive texts with matching attributes', function () {
    var delta = new Delta().insert('a', { bold: true });
    delta.push({ insert: 'b', attributes: { bold: true } });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ insert: 'ab', attributes: { bold: true } });
  });

  it('push(op) consecutive retains with matching attributes', function () {
    var delta = new Delta().retain(1, { bold: true });
    delta.push({ retain: 3, attributes: { bold : true } });
    expect(delta.ops.length).to.equal(1);
    expect(delta.ops[0]).to.deep.equal({ retain: 4, attributes: { bold: true } });
  });

  it('push(op) consecutive texts with mismatched attributes', function () {
    var delta = new Delta().insert('a', { bold: true });
    delta.push({ insert: 'b' });
    expect(delta.ops.length).to.equal(2);
  });

  it('push(op) consecutive retains with mismatched attributes', function () {
    var delta = new Delta().retain(1, { bold: true });
    delta.push({ retain: 3 });
    expect(delta.ops.length).to.equal(2);
  });

  it('push(op) consecutive embeds with matching attributes', function () {
    var delta = new Delta().insert({ url: 'http://quilljs.com' });
    delta.push({ attributes: { url: 'http://quilljs.com' } });
    expect(delta.ops.length).to.equal(2);
  });
});
