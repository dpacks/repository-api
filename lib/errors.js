var list = {
  'UNIQUE constraint failed: dwebs.name, dwebs.user_id': 'A dPack already exists with that name on that account.',
  'UNIQUE constraint failed: users.username': 'A user already exists with that username.',
  'UNIQUE constraint failed: users.email': 'A user already exists with that email.',
  'Authorization failed': 'User does not exist.',
  'Account not verified': 'Password incorrect.',
  'Cannot create account with that email address': 'Account with that email already exists.'
}

module.exports = {
  list: list,
  humanize: function (err) {
    for (var msg in list) {
      if (err.message.indexOf(msg) > -1) {
        return new Error(list[msg])
      }
    }
    return err
  }
}
