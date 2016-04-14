# Rich Text [![Build Status](https://travis-ci.org/ottypes/rich-text.svg?branch=master)](http://travis-ci.org/ottypes/rich-text) [![Coverage Status](https://img.shields.io/coveralls/ottypes/rich-text.svg)](https://coveralls.io/r/ottypes/rich-text)

A format for representing rich text documents and changes. It aimes to be intuitive and human readable with the ability to express any change necessary to deal with rich text. A document can also be expressed with this format--as the change from an empty document.

## Quick Example

```js
var delta = new Delta([
  { insert: 'Gandalf', attributes: { bold: true } },
  { insert: ' the ' },
  { insert: 'Grey', attributes: { color: '#ccc' } }
]);

// Keep the first 12 characters, delete the next 4, and insert a white 'White'
var death = new Delta().retain(12)
                       .delete(4)
                       .insert('White', { color: '#fff' });
// this produces:
// {
//   ops: [
//     { retain: 12 },
//     { delete: '4 ' },
//     { insert: 'White', attributes: { color: '#fff' } }
//   ]
// }

var restored = delta.compose(death);
// restored is:
// {
//   ops: [
//     { insert: 'Gandalf ', attributes: { bold: true } },
//     { insert: 'the ' },
//     { insert: 'White', attributes: { color: '#fff' } }
//   ]
// }

```

This format is suitable for [Operational Transform](https://en.wikipedia.org/wiki/Operational_transformation) and defines several functions ([`compose`](#compose), [`transform`](#transform), [`diff`](#diff)) to support this use case.

## Contents

#### [Operations](#operations-1)

- [insert](#insert-operation)
- [delete](#delete-operation)
- [retain](#retain-operation)

#### [Deltas](#deltas-1)

- [`constructor`](#constructor)
- [`insert`](#insert)
- [`delete`](#delete)
- [`retain`](#retain)
- [`length`](#length)
- [`slice`](#slice)
- [`compose`](#compose)
- [`transform`](#transform)
- [`transformPosition`](#transformposition)

#### [Documents](#documents-1)
- [`concat`](#concat)
- [`diff`](#diff)


## Operations

Operations describe a singular change to a document. They can be an [`insert`](#insert-operation), [`delete`](#delete-operation) or [`retain`](#retain-operation). Note operations do not take an index. They always describe the change at the current index. Use retains to "keep" or "skip" certain parts of the document.

### Insert Operation

Insert operations have an `insert` key defined. A String value represents inserting text. Any other type represents inserting an embed (however only one level of object comparison will be performed for equality).

In both cases of text and embeds, an optional `attributes` key can be defined with an Object to describe additonal formatting information. Formats can be changed by the [retain](#retain) operation.

```js
// Insert a bolded "Text"
{ insert: "Text", attributes: { bold: true } }

// Insert a link
{ insert: "Google", attributes: { href: 'https://www.google.com' } }

// Insert an embed
{
  insert: { image: 'https://octodex.github.com/images/labtocat.png' },
  attributes: { alt: "Lab Octocat" }
}

// Insert another embed
{
  insert: { video: 'https://www.youtube.com/watch?v=dMH0bHeiRNg' },
  attributes: {
    width: 420,
    height: 315
  }
}
```

### Delete Operation

Delete operations have a Number `delete` key defined representing the number of characters to delete. All embeds have a length of 1.

```js
// Delete the next 10 characters
{ delete: 10 }
```

### Retain Operation

Retain operations have a Number `retain` key defined representing the number of characters to keep (other libraries might use the name keep or skip). An optional `attributes` key can be defined with an Object to describe formatting changes to the character range. A value of `null` in the `attributes` Object represents removal of that key.

*Note: It is not necessary to retain the last characters of a document as this is implied.*

```js
// Keep the next 5 characters
{ retain: 5 }

// Keep and bold the next 5 characters
{ retain: 5, attributes: { bold: true } }

// Keep and unbold the next 5 characters
// More specifically, remove the bold key in the attributes Object
// in the next 5 characters
{ retain: 5, attributes: { bold: null } }
```


## Deltas

A Delta is made up of an array of operations. All methods maintain the property that Deltas are represented in the most compact form. For example two consecutive insert operations of plain text will be merged into one. Thus a vanilla deep Object/Array comparison can be used to determine Delta equality.

---

### constructor

Creates a new Delta object.

#### Methods

- `new Delta()`
- `new Delta(ops)`
- `new Delta(delta)`

#### Parameters

- `ops` - Array of operations
- `delta` - Object with an `ops` key set to an array of operations

*Note: No validity/sanity check is performed when constructed with ops or delta. The new delta's internal ops array will also be assigned to ops or delta.ops without deep copying.*

#### Example

```js
var delta = new Delta([
  { insert: 'Hello World' },
  { insert: '!', attributes: { bold: true }}
]);

var packet = JSON.stringify(delta);

var other = new Delta(JSON.parse(packet));

var chained = new Delta().insert('Hello World').insert('!', { bold: true });
```

---

### insert()

Appends an insert operation. Returns `this` for chainability.

#### Methods

- `insert(text, attributes)`
- `insert(embed, attributes)`

#### Parameters

- `text` - String representing text to insert
- `embed` - Number representing embed type to insert
- `attributes` - Optional attributes to apply

#### Example

```js
delta.insert('Text', { bold: true, color: '#ccc' });
delta.insert(1, { src: 'https://octodex.github.com/images/labtocat.png' });
```

---

### delete()

Appends a delete operation. Returns `this` for chainability.

#### Methods

- `delete(length)`

#### Parameters

- `length` - Number of characters to delete

#### Example

```js
delta.delete(5);
```

---

### retain()

Appends a retain operation. Returns `this` for chainability.

#### Methods

- `retain(length, attributes)`

#### Parameters

- `length` - Number of characters to retain
- `attributes` - Optional attributes to apply

#### Example

```js
delta.retain(4).retain(5, { color: '#0c6' });
```

---

### length()

Returns length of a Delta, which is the sum of the lengths of its operations.

#### Methods

- `length()`

#### Example

```js
new Delta().insert('Hello').length();  // Returns 5

new Delta().insert('A').retain(2).delete(1) // Returns 4
```

---

### slice()

Returns copy of delta with subset of operations.

#### Methods

- `slice()`
- `slice(start)`
- `slice(start, end)`

#### Parameters

- `start` - Start index of subset, defaults to 0
- `end` - End index of subset, defaults to rest of operations

#### Example

```js
var delta = new Delta().insert('Hello', { bold: true }).insert(' World');

// {
//   ops: [
//     { insert: 'Hello', attributes: { bold: true } },
//     { insert: ' World' }
//   ]
// }
var copy = delta.slice();

// { ops: [{ insert: 'World' }] }
var world = delta.slice(6);

// { ops: [{ insert: ' ' }] }
var space = delta.slice(5, 6);
```

---

### compose()

Returns a Delta that is equivalent to applying the operations of own Delta, followed by another Delta.

#### Methods

- `compose(other)`

#### Parameters

- `other` - Delta to compose

#### Example

```js
var a = new Delta().insert('abc');
var b = new Delta().retain(1).delete(1);

var composed = a.compose(b);  // composed == new Delta().insert('ac');

```

---

### transform()

Transform given Delta against own operations.

#### Methods

- `transform(other, priority)`
- `transform(index)` - Alias for [`transformPosition`](#tranformposition)

#### Parameters

- `other` - Delta to transform
- `priority` - Boolean used to break ties

#### Returns

- `Delta` - transformed Delta

#### Example

```js
var a = new Delta().insert('a');
var b = new Delta().insert('b');

b = a.transform(b, true);  // new Delta().retain(1).insert('b');
```

---

### transformPosition()

Transform an index against the delta. Useful for representing cursor/selection positions.

#### Methods

- `transformPosition(index)`

#### Parameters

- `index` - index to transform

#### Returns

- `Number` - transformed index

#### Example

```js
var index = 12;
var transformedIndex = delta.transformPosition(index);
```


## Documents

A Delta with only insert operations can be used to represent a rich text document. This can be thought of as a Delta applied to an empty document.

The following methods are supported only for Deltas that represent a document (i.e. they only contain inserts). There are no guarantees on the behavior on non-document Deltas.

---

### concat()

Returns a new Delta representing the concatenation of this and another document Delta's operations.

#### Methods

- `concat(other)`

#### Parameters

- `other` - Document Delta to concatenate

#### Returns

- `Delta` - Concatenated document Delta

#### Example

```js
var a = new Delta().insert('Hello');
var b = new Delta().insert('!', { bold: true });


// {
//   ops: [
//     { insert: 'Hello' },
//     { insert: '!', attributes: { bold: true } }
//   ]
// }
var concat = a.concat(b);
```

---

### diff()

Returns a Delta representing the difference between two documents.

#### Methods

- `diff(other)`

#### Parameters

- `other` - Document Delta to diff against

#### Returns

- `Delta` - difference between the two documents

#### Example

```js
var a = new Delta().insert('Hello');
var b = new Delta().insert('Hello!');

var diff = a.diff(b);  // { ops: [{ retain: 5 }, { insert: '!' }] }
                       // a.compose(diff) == b

```
