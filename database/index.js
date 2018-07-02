var Knex = require('knex')
var Users = require('./users')
var DPacks = require('./dpacks')

module.exports = function (config) {
  if (!config.db) throw new Error('config.db required! Must be a knex compatible object.')
  config.db.timezone = 'UTC'
  var knex = Knex(config.db)
  var db = {
    knex: knex,
    users: Users(knex, config),
    dpacks: DPacks(knex, config)
  }
  return db
}
