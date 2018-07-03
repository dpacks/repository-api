const fs = require('fs')
const rimraf = require('rimraf')

module.exports = {
  tearDown: function (config, close) {
    rimraf(config.dwid.db, function () {
      fs.unlink(config.db.connection.filename, function () {
        close()
      })
    })
  },
  users: {
    joe: {name: 'joe schmo', username: 'joe', password: 'very secret', email: 'hi@joe.com', description: 'hello i am a description', token: null},
    bob: {name: 'bob smob', username: 'bob', password: 'so secret', email: 'hi@bob.com', description: 'i like it', token: null},
    admin: {name: 'pam spam', username: 'admin', password: 'secret123', email: 'hi@pam.com', description: 'i dont eat it', token: null}
  },
  dpacks: {
    cats: {name: 'cats', url: 'dweb://ahashfordpacks', title: 'all of the cats', description: 'live on the corner of washington and 7th', keywords: 'furry, fluffy'},
    penguins: {name: 'penguins', url: 'dweb://ahashforpenguins', title: 'all of the penguins', description: 'lives in your house', keywords: 'sloppy, loud'},
    dogs: {name: 'dogs', url: 'dweb://ahashfordogs', title: 'all of the dogs', description: 'lives in your house', keywords: 'sloppy, loud'}
  }
}
