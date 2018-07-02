const debug = require('debug')('@dpacks/repository')
const models = require('./models')

module.exports = DPacks

function DPacks (knex, config) {
  if (!(this instanceof DPacks)) return new DPacks(knex, config)
  this.knex = knex
  this.models = models(knex)
  this.keys = ['name', 'user_id', 'url', 'name', 'description']
}

/**
 * Create a dat in the database.
 * @param  {Object}   values The values of the new dat
 * @param  {Function} cb     The callback.
 * @return {Object}          The dat as it appears in the database.
 */
DPacks.prototype.create = function (values, cb) {
  this.models.dpacks.create(this._validate(values), cb)
}

DPacks.prototype._validate = function (values) {
  var body = {}

  for (var i in this.keys) {
    var key = this.keys[i]
    body[key] = values[key]
  }

  if (Array.isArray(values['keywords'])) body['keywords'] = values['keywords'].join(' ')
  return body
}

/**
 * Update a dat in the database.
 * @param  {Object}   where The query parameters to define which rows to update.
 * @param  {Object}   values The values to update.
 * @param  {Function} cb    The callback.
 * @return {Number}         Number of rows updated.
 */
DPacks.prototype.update = function (where, values, cb) {
  if (!where.id) return cb(new Error('id required'))
  this.models.dpacks.update({id: where.id}, this._validate(values), cb)
}

DPacks.prototype.get = function (where, cb) {
  this.models.dpacks.get(where, cb)
}

/**
 * Search the database for a dat. Can limit search by adding the 'fields'
 * which is an array of fields to include in the search.
 * @param  {Object}   where The parameters of the query, takes `limit`, `offset`, `query`, `fields`.
 * @param  {Function} cb    The callback.
 */
DPacks.prototype.search = function (where, cb) {
  var limit = where.limit
  var offset = where.offset || 0
  var statement = 'SELECT users.username, dpacks.id, dpacks.url, dpacks.name, dpacks.created_at from dats inner join users on dpacks.user_id=users.id'
  if (where.query) {
    if (!where.fields) where.fields = ['name', 'url', 'description', 'title', 'keywords']
    if (!Array.isArray(where.fields)) where.fields = where.fields.split(',')
    statement += ' WHERE '
    for (var key in where.fields) {
      var field = where.fields[key]
      statement += 'dpacks.' + field + " LIKE '%" + where.query + "%'"
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
 * Delete a dat from the database.
 * @param  {Object}   where A dictionary of params for deletion, id key required.
 * @param  {Function} cb    The callback.
 * @return {Number}         Number of rows deleted.
 */
DPacks.prototype.delete = function (where, cb) {
  if (!where.id) return cb(new Error('id required'))
  this.models.dpacks.delete(where, cb)
}

/**
 * Get dats given their shortname -- username and dataset name.
 * TODO: make this method use underlying SQL for better performance.
 * @param  {Object}   params Username and dataset name.
 * @param  {Function} cb     The callback.
 * @return {Object}          The dat published by that username and dataset name.
 */
DPacks.prototype.getByShortname = function (params, cb) {
  var self = this
  self.models.users.get({username: params.username}, function (err, results) {
    if (err) return cb(err)
    if (!results.length) return cb(new Error('Username not found.'))
    var user = results[0]
    self.models.dpacks.get({user_id: user.id, name: params.dataset}, function (err, results) {
      if (err) return cb(err)
      if (!results.length) return cb(new Error('Dat with that name not found.'))
      var dat = results[0]
      return cb(null, dat)
    })
  })
}
