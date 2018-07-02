var model = require('./model')

module.exports = function (knex) {
  return {
    dpacks: model(knex, 'dats', {primaryKey: 'id'}),
    users: model(knex, 'users', {primaryKey: 'id'})
  }
}
