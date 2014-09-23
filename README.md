# Rich Text [![Build Status](https://travis-ci.org/ottypes/rich-text.svg?branch=master)](http://travis-ci.org/ottypes/rich-text) [![Coverage Status](https://img.shields.io/coveralls/ottypes/rich-text.svg)](https://coveralls.io/r/ottypes/rich-text)

A format for representing rich text documents and changes. This format is suitable for [Operational Transform](https://en.wikipedia.org/wiki/Operational_transformation) and defines several functions to support this use case.


### Quick Example

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

var delta = delta.compose(death);
// Result is:
// {
//   ops: [
//     { insert: 'Gandalf ', attributes: { bold: true } },
//     { insert: 'the ' },
//     { insert: 'White', attributes: { color: '#fff' } }
//   ]
// }
```


## Operations

Operations describe a singular change to a document. They can be an insert, delete or retain. Note operations do not take an index. They always describe the change at the current index. Use retains to "keep" or "skip" certain parts of the document.

### Insert Operation

Insert operations have an `insert` key defined. A String value represents inserting text. A Number represents inserting an embed. In both cases an optional `attributes` key can be defined with an Object to describe additonal formatting information. Formats can be changed by the [retain](#retain) operation.

```js
// Insert a bolded "Text"
{ insert: "Text", attributes: { bold: true } }

// Insert a link
{ insert: "Google", attributes: { href: 'https://www.google.com' } }

// Insert an image
{
  insert: 1,
  attributes: {
    alt: "Lab Octocat",
    src: 'https://octodex.github.com/images/labtocat.png'
  }
}

// Insert a video
{
  insert: 2,
  attributes: {
    src: "https://www.youtube.com/watch?v=dMH0bHeiRNg",
    width: 420,
    height: 315
  }
}
```

It is not set anywhere that a 1 means an image and 2 means a video.

### Delete Operation

Delete operations have a Number `delete` key defined representing the number of characters to delete. All embeds have a length of 1.

```js
// Delete the next 10 characters
{ delete: 10 }
```

### Retain Operation

Retain operations have a Number `retain` key defined representing the number of characters to keep (other libraries use the name keep or skip). An optional `attributes` key can be defined with an Object to describe formatting changes to the character range. A value of null in the `attributes` Object represents removal of that key.

*Note: It is not necessary to retain the end of a document as this is implied.*

```js
// Keep the next 5 characters
{ retain: 5 }

// Keep and bold the next 5 characters
{ retain: 5, attributes: { bold: true } }

// Keep and unbold the next 5 characters
// More specifically, remove the bold key in the attributes Object in the next 5 characters
{ retain: 5, attributes: { bold: null } }
```


## Deltas

A Delta is made up of an array of operations. Unless otherwise specified all methods are self modifying and returns `this` for chainability.

Deltas should always be represented in the most compact form. For example two consecutive insert operations of plain text should always be combined into one.


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


### insert(insert, attributes)

Appends an insert operation.

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


### delete()

Appends a delete operation.

#### Methods

- `delete(length)`

#### Parameters

- `length` - Number of characters to delete

#### Example

```js
delta.delete(5);
```

### retain()

Appends a retain operation.

#### Methods

- `retain(length, attributes)`

#### Parameters

- `length` - Number of characters to retain
- `attributes` - Optional attributes to apply

#### Example

```js
delta.retain(4).retain(5, { color: '#0c6' });
```


### compose()

Compose with another Delta.

#### Methods

- `compose(other)`

#### Parameters

- `other` - Delta to compose

#### Example

```js
var a = new Delta().insert('abc');
var b = new Delta().retain(1).delete(1);

a.compose(b);  //new Delta().insert('ac');
```


### transform()

Transform against another Delta.

#### Methods

- `transform(other, priority)`

#### Parameters

- `other` - Delta to transform
- `priority` - Boolean indicating priority, used to break ties

#### Example

```js
var a = new Delta().insert('a');
var b = new Delta().insert('b');

a.tranform(b, true);  // new Delta().retain(1).insert('b');
```


## Documents

A Delta with only insert operations can be used to represent a rich text document.
