const fs = require('fs')
const path = require('path')
const xtend = require('xtend')
var defaultCfg = require('../config/config.default')

module.exports = function (config) {
  config = xtend(defaultCfg, config)

  function data (configPath) {
    var datadir = config.data || process.env.DATADIR || path.join(__dirname, '..', 'data')
    return path.join(datadir, configPath)
  }

  if (config.dwid) {
    var DWAUTH = config.dwid
    DWAUTH.db = data(config.dwid.db)
    if (DWAUTH.publicKey) DWAUTH.publicKey = fs.readFileSync(data(DWAUTH.publicKey)).toString()
    if (DWAUTH.privateKey) DWAUTH.privateKey = fs.readFileSync(data(DWAUTH.privateKey)).toString()
  }
  if (config.db.dialect === 'sqlite3') config.db.connection.filename = data(config.db.connection.filename)
  if (config.vaultr.dir === 'vaultr') config.vaultr.dir = data(config.vaultr.dir)

  return config
}
