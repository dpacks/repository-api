var model = require('./model')

module.exports = function (knex) {
  return {
    dwebs: model(knex, 'dwebs', {primaryKey: 'id'}),
    users: model(knex, 'users', {primaryKey: 'id'})
  }
}
