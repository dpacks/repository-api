const wrap = require('co-express')
const DPacks = require('./api/dpacks')
const Users = require('./api/users')
const Auth = require('./auth')
const database = require('./database')
const Vaultr = require('./lib/vaultr')
const Config = require('./config')

module.exports = function (input) {
  var config = Config(input)
  var db = config.database || database(config)
  const vaultr = config.dpacks || Vaultr(config.vaultr)
  const auth = Auth(config, db)
  var users = Users(auth, db)
  var dpacks = DPacks(auth, db, vaultr)

  wrapAll(users)
  wrapAll(dpacks)

  return {
    config: config,
    db: db,
    auth: auth,
    vaultr: vaultr,
    users: users,
    dpacks: dpacks,
    close: function (cb) {
      db.knex.destroy(function () {
        vaultr.close(cb)
      })
    }
  }
}

function wrapAll (api) {
  for (let methodName of Object.getOwnPropertyNames(Object.getPrototypeOf(api))) {
    let method = api[methodName]
    if (typeof method === 'function' && methodName.charAt(0) !== '_') {
      api[methodName] = wrap(method.bind(api))
    }
  }
  return api
}
