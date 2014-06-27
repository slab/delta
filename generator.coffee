{Delta} = require 'tandem-core'
utils = require('tandem-core/build/delta_generator').getUtils()

tandem = require './tandem'

tandem.generateRandomDoc = ->
  Delta.getInitial 'abcde'

tandem.generateRandomOp = (delta) ->
  newDelta = utils.getRandomDelta delta, 0
  expectedResult = delta.compose newDelta

  [newDelta, expectedResult]
  


module.exports = tandem

