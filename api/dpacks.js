var onerror = require('./onerror')
var send = require('./send')

module.exports = DPacks

/**
 * Interface between API requests and the database. Validation logic for
 * the incoming request goes here. If request is valid, will dispatch to database
 * methods.
 * @param {Object} auth dPack repository Auth instance
 * @param {Object} db   dPack repository Database instance
 * @param {Object} vaultr dPack repository Vaultr instance
 */
function DPacks (auth, db, vaultr) {
  if (!(this instanceof DPacks)) return new DPacks(auth, db, vaultr)
  this.db = db
  this.auth = auth
  this.vaultr = vaultr
}

DPacks.prototype._user = function (req, res, cb) {
  this.auth.currentUser(req, function (err, user) {
    if (err) return onerror(err, res)
    return cb(user)
  })
}

/**
 * POST request for the DPack model. Used to create new dPacks. Must be logged in.
 * DPack must be available on the network.
 * @param  {Object}   req The incoming request.
 */
DPacks.prototype.post = function (req, res) {
  var self = this
  if (!req.body.name) return onerror(new Error('Name required.'), res)
  if (!req.body.url) return onerror(new Error('URL required.'), res)
  // creating a new dPack.
  self._user(req, res, function (user) {
    if (!user && !user.id) return onerror(new Error('Must be logged in to do that.'), res)

    // So admins can create dPacks for other users, otherwise defaults to current user id.
    if (!user.admin || !req.body.user_id) req.body.user_id = user.id

    if (!self.vaultr.opts.verifyConnection) return addDPack(req, user)
    // let's only add dPacks if the url is up
    self.vaultr.get(req.body.url, function (err, vault, key) {
      if (err) return onerror(err, res)
      var timeout = req.body.timeout || 10000
      self.vaultr.metadata(vault, {timeout}, function (err, info) {
        if (err) return onerror(err, res)
        addDPack(req, user)
      })
    })
  })

  function addDPack (req, user) {
    self.db.dpacks.get({name: req.body.name, user_id: user.id}, function (err, data) {
      if (err) return onerror(err, res)
      if (data.length > 0) {
        // dPack exists. updating
        self.db.dpacks.update({id: data[0].id}, req.body, function (err, data) {
          if (err) return onerror(err, res)
          send({updated: data}, res)
        })
      } else {
        self.db.dpacks.create(req.body, function (err, data) {
          if (err) return onerror(err, res)
          send(data, res, 201)
        })
      }
    })
  }
}

/**
 * PUT request for the DPack model. Used to update dpacks. Must be logged in.
 * Can only update dPacks that you've created.
 * @param  {[type]}   req The incoming request.
 */
DPacks.prototype.put = function (req, res) {
  var self = this
  self._user(req, res, function (user) {
    if (!user) return onerror(new Error('Must be logged in to do that.'), res)
    if (!req.body.id) return onerror(new Error('id required'), res)
    self.db.dpacks.get({id: req.body.id}, function (err, results) {
      if (err) return onerror(err, res)
      if (!results.length) return onerror(new Error('dPack does not exist.'), res)
      if (!user.admin && results[0].user_id !== user.id) return onerror(new Error('Cannot update someone elses dPack.'), res)
      self.db.dpacks.update({id: req.body.id}, req.body, function (err, data) {
        if (err) return onerror(err, res)
        send({updated: data}, res)
      })
    })
  })
}

/**
 * GET request for the DPack model. Don't need to be logged in.
 * @param  {Object}   req The incoming request.
 */
DPacks.prototype.get = function (req, res) {
  var cb = function (err, data) {
    if (err) return onerror(err, res)
    return send(data, res)
  }
  if (req.query.search) return this.db.dpacks.search(req.query.search, cb)
  return this.db.dpacks.get(req.query, cb)
}

/**
 * DELETE request for the DPack model. Can only delete your own dPacks while logged in.
 * @param  {[type]}   req The incoming request.
 */
DPacks.prototype.delete = function (req, res) {
  var self = this
  self._user(req, res, function (user) {
    if (!user) return onerror(new Error('Must be logged in to do that.'), res)
    self.db.dpacks.get(req.body, function (err, results) {
      if (err) return onerror(err, res)
      if (!results.length) return onerror(new Error('dPack does not exist.'), res)
      if (!user.admin && results[0].user_id !== user.id) return onerror(new Error('Cannot delete someone elses dPack.'), res)
      self.db.dpacks.delete({id: results[0].id}, function (err, data) {
        if (err) return onerror(err, res)
        send({deleted: data}, res)
      })
    })
  })
}
