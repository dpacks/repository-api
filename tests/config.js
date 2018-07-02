module.exports = {
  data: '.',
  admins: [
    'admin'
  ],
  dwid: {
    secret: 'very very not secret',
    db: 'dwid.db'
  },
  email: {
    fromEmail: 'hi@example.com'
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
