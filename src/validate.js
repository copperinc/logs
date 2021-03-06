let { updater } = require('@architect/utils')
let update = updater('Logs')

module.exports = function validate (/* opts*/) {
  try {
    if (process.env.ARC_AWS_CREDS === 'missing')
      throw Error('missing or invalid AWS credentials or credentials file')

    if (!process.env.AWS_REGION)
      throw Error('@aws region / AWS_REGION must be configured')
  }
  catch (e) {
    update.error(`Failed to access logs, ${e.message}`)
    process.exit(1)
  }
}
