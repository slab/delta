tandem = require 'tandem-core'

makeDelta = tandem.Delta.makeDelta

exports.type =
  name: 'quill'
  uri: 'http://quilljs.com/types/quill'

  create: (initialString) ->
    tandem.Delta.getInitial initialString || '\n'

  apply: (snapshot, op) ->
    makeDelta(snapshot).compose makeDelta(op)

  transform: (op1, op2, side) ->
    op1.transform op2, side == 'left'

  compose: (op1, op2) ->
    op1.compose op2

  deserialize: (data) ->
    tandem.Delta.makeDelta data

