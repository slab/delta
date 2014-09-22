# Rich Text [![Build Status](https://travis-ci.org/ottypes/rich-text.svg?branch=master)](http://travis-ci.org/ottypes/rich-text) [![Coverage Status](https://img.shields.io/coveralls/ottypes/rich-text.svg)](https://coveralls.io/r/ottypes/rich-text)

A format for representing rich text documents and changes. This format is suitable for [Operational Transform](https://en.wikipedia.org/wiki/Operational_transformation) and defines several functions to support this use case.

### Quick Example

```js
var delta = new Delta([
  { insert: 'Gandalf ', formats: { bold: true } },
  { insert: 'the ' },
  { insert: 'Grey', formats: { color: '#ccc' } }
]);

// Keep the first 12 characters, delete the next 4, and insert a white 'White'
var death = new Delta().retain(12)
                       .delete(4)
                       .insert('White', { color: '#fff' });


// Result is:
// {
//   ops: [
//     { insert: 'Gandalf ', formats: { bold: true } },
//     { insert: 'the ' },
//     { insert: 'White', formats: { color: '#fff' } }
//   ]
// }
var delta = delta.compose(death);
```


## Operations

Operations describe a singular change to a document. They can be an insert, delete or retain. Note operations do not take an index. They always describe the change at the current index. Use retains to "keep" or "skip" certain parts of the document.

### Insert

Insert operations have an `insert` key defined. A String value represents inserting text. A Number represents inserting an embed. In both cases an optional `formats` key can be defined with an Object to describe additonal formatting information. Formats can be changed by the [retain](#retain) operation.

```js
// Insert a bolded "Text"
{ insert: "Text", formats: { bold: true } }

// Insert a link
{ insert: "Google", formats: { href: 'https://www.google.com' } }

// Insert an image
{ 
  insert: 1,    // The 1 here is arbitrary, 
  formats: { 
    alt: "Lab Octocat", 
    src: 'https://octodex.github.com/images/labtocat.png' 
  }
}

// Insert a video
{
  insert: 2,
  formats: {
    src: "https://www.youtube.com/watch?v=dMH0bHeiRNg",
    width: 420,
    height: 315
  }
}
```


### Delete

Delete operations have a Number `delete` key defined representing the number of characters to delete. All embeds have a length of 1.

```js
// Delete the next 10 characters
{ delete: 10 }
```


### Retain

Retain operations have a Number `retain` key defined representing the number of characters to keep (other libraries use the name keep or skip). An optional `formats` key can be defined with an Object to describe formatting changes to the character range. A value of null in the `formats` Object represents removal of that key.

```js
// Keep the next 5 characters
{ retain: 5 }

// Bold the next 5 characters
{ retain: 5, formats: { bold: true } }

// Unbold the next 5 characters
// More specifically, remove the bold key in the formats Object in the next 5 characters
{ retain: 5, formats: { bold: null } }
```


## Deltas
