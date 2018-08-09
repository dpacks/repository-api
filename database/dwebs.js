const debug = require('debug')('@dwebs/repository')
const models = require('./models')

module.exports = DWebs

function DWebs (knex, config) {
  if (!(this instanceof DWebs)) return new DWebs(knex, config)
  this.knex = knex
  this.models = models(knex)
  this.keys = ['name', 'user_id', 'url', 'name', 'description']
}

/**
 * Create a dPack in the database.
 * @param  {Object}   values The values of the new dPack
 * @param  {Function} cb     The callback.
 * @return {Object}          The dPack as it appears in the database.
 */
DWebs.prototype.create = function (values, cb) {
  this.models.dwebs.create(this._validate(values), cb)
}

DWebs.prototype._validate = function (values) {
  var body = {}

  for (var i in this.keys) {
    var key = this.keys[i]
    body[key] = values[key]
  }

  if (Array.isArray(values['keywords'])) body['keywords'] = values['keywords'].join(' ')
  return body
}

/**
 * Update a dPack in the database.
 * @param  {Object}   where The query parameters to define which rows to update.
 * @param  {Object}   values The values to update.
 * @param  {Function} cb    The callback.
 * @return {Number}         Number of rows updated.
 */
DWebs.prototype.update = function (where, values, cb) {
  if (!where.id) return cb(new Error('id required'))
  this.models.dwebs.update({id: where.id}, this._validate(values), cb)
}

DWebs.prototype.get = function (where, cb) {
  this.models.dwebs.get(where, cb)
}

/**
 * Search the database for a dPack. Can limit search by adding the 'fields'
 * which is an array of fields to include in the search.
 * @param  {Object}   where The parameters of the query, takes `limit`, `offset`, `query`, `fields`.
 * @param  {Function} cb    The callback.
 */
DWebs.prototype.search = function (where, cb) {
  var limit = where.limit
  var offset = where.offset || 0
  var statement = 'SELECT users.username, dwebs.id, dwebs.url, dwebs.name, dwebs.created_at from dwebs inner join users on dwebs.user_id=users.id'
  if (where.query) {
    if (!where.fields) where.fields = ['name', 'url', 'description', 'title', 'keywords']
    if (!Array.isArray(where.fields)) where.fields = where.fields.split(',')
    statement += ' WHERE '
    for (var key in where.fields) {
      var field = where.fields[key]
      statement += 'dwebs.' + field + " LIKE '%" + where.query + "%'"
      if (key < where.fields.length - 1) statement += ' OR '
    }
    statement += (limit ? ' LIMIT ' + limit : '') +
      (offset ? ' OFFSET ' + offset || 0 : '') +
      ';'
  }

  debug(statement)
  this.knex.raw(statement).then(function (resp) {
    return cb(null, resp)
  }).catch(cb)
}

/**
 * Delete a dPack from the database.
 * @param  {Object}   where A dictionary of params for deletion, id key required.
 * @param  {Function} cb    The callback.
 * @return {Number}         Number of rows deleted.
 */
DWebs.prototype.delete = function (where, cb) {
  if (!where.id) return cb(new Error('id required'))
  this.models.dwebs.delete(where, cb)
}

/**
 * Get dPacks given their shortname -- username and dataset name.
 * TODO: make this method use underlying SQL for better performance.
 * @param  {Object}   params Username and dataset name.
 * @param  {Function} cb     The callback.
 * @return {Object}          The dPack published by that username and dataset name.
 */
DWebs.prototype.getByShortname = function (params, cb) {
  var self = this
  self.models.users.get({username: params.username}, function (err, results) {
    if (err) return cb(err)
    if (!results.length) return cb(new Error('Username not found.'))
    var user = results[0]
    self.models.dwebs.get({user_id: user.id, name: params.dataset}, function (err, results) {
      if (err) return cb(err)
      if (!results.length) return cb(new Error('dPack with that name not found.'))
      var dweb = results[0]
      return cb(null, dweb)
    })
  })
}
