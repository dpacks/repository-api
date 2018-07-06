module.exports = {
  data: 'data',
  admins: ['admins'],
  dwid: {
    secret: 'secret-password',
    db: 'dwid.db'
  },
  email: {
    from: 'noreply@dpacks.io',
    smtpConfig: undefined
  },
  db: {
    dialect: 'sqlite3',
    connection: {
      filename: 'sqlite.db'
    },
    useNullAsDefault: true
  },
  whitelist: false,
  vaultr: {
    dir: 'vaultr',
    verifyConnection: false,
    timeout: 3000
  }
}
