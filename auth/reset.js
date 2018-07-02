const nodemailer = require('nodemailer')
const debug = require('debug')('@dpacks/repository')
const mockTransport = require('nodemailer-mock-transport')
const createReset = require('@dwauth/reset-password')
const resetPasswordHTML = require('../mailers/resetPassword')

module.exports = function (config, dwidDb) {
  const dwidReset = createReset(dwidDb, config.dwid)
  debug('setup mailer', config.email.smtpConfig)
  config.email.mailer = nodemailer.createTransport(config.email.smtpConfig || mockTransport())

  return {
    mail: mail,
    confirm: dwidReset.confirm
  }

  function mail (userEmail, accountKey, cb) {
    dwidReset.create({ accountKey: accountKey }, function (err, token) {
      if (err) return cb(new Error('problem creating reset token'))
      const clientHost = process.env.VIRTUAL_HOST
      ? `https://${process.env.VIRTUAL_HOST.split(',')[0]}` // can be comma separated hosts
      : 'http://localhost:8080'
      var reseturl = `${clientHost}/reset-password?accountKey=${accountKey}&resetToken=${token}&email=${userEmail}`

      var emailOptions = {
        to: userEmail,
        from: config.email.from,
        subject: 'Reset your password at dpacks.io',
        html: resetPasswordHTML({reseturl: reseturl})
      }

      debug('sending mail', emailOptions)
      config.email.mailer.sendMail(emailOptions, function (err, info) {
        debug('got', err, info)
        if (err) return cb(err)
        if (config.email.mailer.transporter.name === 'Mock') {
          console.log('mock email sent', emailOptions)
        }
        cb()
      })
    })
  }
}
