const mkdirp = require('mkdirp')
const encoding = require('@dwebs/codec')
const dPackHealth = require('@dpack/health')
const debug = require('debug')('@dpacks/repository')
const resolve = require('@dwebs/resolve')
const ddrive = require('@ddrive/core')
const vaultr = require('@ddatabase/vaultr')
const flock = require('ddb-vaultr/flock')

module.exports = Vaultr

function Vaultr (opts) {
  if (!(this instanceof Vaultr)) return new Vaultr(opts)
  var dir = opts.dir
  this.opts = opts
  mkdirp.sync(dir)
  this.ar = vaultr(dir, {sparse: true})
  this.flock = flock(this.ar)
}

Vaultr.prototype.health = function (archive) {
  var health = archive.health.get()
  if (!health) return
  health.completedPeers = health.peers ? health.peers.filter(peer => {
    return peer.have === peer.length
  }) : []
  health.progressPeers = health.peers ? health.peers.filter(peer => {
    return peer.have !== peer.length
  }) : []
  debug('got health', health)
  return health
}

Vaultr.prototype.get = function (link, opts, cb) {
  var self = this
  debug('vaultr getting', link)
  if (typeof opts === 'function') return this.get(link, {}, opts)
  resolve(link, function (err, key) {
    if (err) {
      console.trace(err)
      return cb(new Error('Invalid key'))
    }
    var buf = encoding.toBuf(key)
    debug('got key', key)
    self.ar.get(buf, function (err, metadata, content) {
      if (!err) {
        debug('found ddrive', key)
        var archive = ddrive(null, {metadata: metadata, content: content})
        archive.health = hyperhealth(archive)
        return cb(null, archive, key)
      }
      if (err.message === 'Could not find feed') {
        debug('could not find feed, trying again', key)
        self.ar.add(buf, function (err) {
          if (err) return cb(err)
          return self.get(buf, opts, cb)
        })
      } else return cb(err)
    })
  })
}

Vaultr.prototype.metadata = function (archive, opts, cb) {
  var self = this
  debug('getting metadata for', archive.key)
  if (typeof opts === 'function') return self.metadata(archive, {}, opts)
  var dpack = {}
  var cancelled = false

  var timeout = setTimeout(function () {
    if (dpack.entries) return done(null, dpack)
    var msg = 'timed out'
    debug(msg, dpack)
    return done(new Error(msg), dpack)
  }, parseInt(opts.timeout))

  function done (err, dpack) {
    clearTimeout(timeout)
    if (cancelled) return
    cancelled = true
    return cb(err, dpack)
  }
  archive.metadata.update()
  archive.tree.list('/', {nodes: true}, function (err, entries) {
    if (err) {
      debug('updating metadata')
      return archive.metadata.update(function () {
        if (cancelled) return
        cancelled = true
        self.metadata(archive, opts, cb)
      })
    }
    if (cancelled) return done(null, dpack)

    debug('got', entries.length, 'entries')
    for (var i in entries) {
      var entry = entries[i]
      entries[i] = entry.value
      entries[i].name = entry.name
      entries[i].type = 'file'
    }
    dpack.entries = entries
    var filename = 'dpack.json'
    archive.stat(filename, function (err, entry) {
      if (err || cancelled) return done(null, dpack)
      archive.readFile(filename, function (err, metadata) {
        if (err || cancelled) return done(null, dpack)
        try {
          dpack.metadata = metadata ? JSON.parse(metadata.toString()) : undefined
        } catch (e) {
          err = new Error('dpack.json file malformed')
        }
        dpack.size = archive.content.byteLength
        return done(err, dpack)
      })
    })
  })
}

Vaultr.prototype.close = function (cb) {
  this.flock.destroy(cb)
}
