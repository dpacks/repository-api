const validator = require('is-my-json-valid')

module.exports = {
  dwebs: validator({
    properties: {
      name: {
        required: true,
        type: 'string',
        pattern: '^[a-zA-Z-]+$'
      }
    },
    verbose: true
  })
}
