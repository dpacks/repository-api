const mkdirp = require('mkdirp')
const encoding = require('@dwebs/codec')
const dWebHealth = require('@dpack/health')
const debug = require('debug')('@dpacks/api')
const resolve = require('@dwebs/resolve')
const ddrive = require('@ddrive/core')
const vaultr = require('@ddatabase/vaultr')
const flock = require('@ddatabase/vaultr/flock')

module.exports = Vaultr

function Vaultr (opts) {
  if (!(this instanceof Vaultr)) return new Vaultr(opts)
  var dir = opts.dir
  this.opts = opts
  mkdirp.sync(dir)
  this.ar = vaultr(dir, {sparse: true})
  this.flock = flock(this.ar)
}

Vaultr.prototype.health = function (vault) {
  var health = vault.health.get()
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
        var vault = ddrive(null, {metadata: metadata, content: content})
        vault.health = dWebHealth(vault)
        return cb(null, vault, key)
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

Vaultr.prototype.metadata = function (vault, opts, cb) {
  var self = this
  debug('getting metadata for', vault.key)
  if (typeof opts === 'function') return self.metadata(vault, {}, opts)
  var dweb = {}
  var cancelled = false

  var timeout = setTimeout(function () {
    if (dweb.entries) return done(null, dweb)
    var msg = 'timed out'
    debug(msg, dweb)
    return done(new Error(msg), dweb)
  }, parseInt(opts.timeout))

  function done (err, dweb) {
    clearTimeout(timeout)
    if (cancelled) return
    cancelled = true
    return cb(err, dweb)
  }
  vault.metadata.update()
  vault.tree.list('/', {nodes: true}, function (err, entries) {
    if (err) {
      debug('updating metadata')
      return vault.metadata.update(function () {
        if (cancelled) return
        cancelled = true
        self.metadata(vault, opts, cb)
      })
    }
    if (cancelled) return done(null, dweb)

    debug('got', entries.length, 'entries')
    for (var i in entries) {
      var entry = entries[i]
      entries[i] = entry.value
      entries[i].name = entry.name
      entries[i].type = 'file'
    }
    dweb.entries = entries
    var filename = 'dweb.json'
    vault.stat(filename, function (err, entry) {
      if (err || cancelled) return done(null, dweb)
      vault.readFile(filename, function (err, metadata) {
        if (err || cancelled) return done(null, dweb)
        try {
          dweb.metadata = metadata ? JSON.parse(metadata.toString()) : undefined
        } catch (e) {
          err = new Error('dweb.json file malformed')
        }
        dweb.size = vault.content.byteLength
        return done(err, dweb)
      })
    })
  })
}

Vaultr.prototype.close = function (cb) {
  this.flock.destroy(cb)
}
