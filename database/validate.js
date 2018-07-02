const validator = require('is-my-json-valid')

module.exports = {
  dpacks: validator({
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
