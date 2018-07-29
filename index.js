const flumeView = require('flumeview-reduce')
const mkdirp = require('mkdirp')
const { join } = require('path')
const level = require('level')
const charwise = require('charwise')
const Value = require('mutant/value')

module.exports = {
  name: 'unread',
  version: require('./package.json').version,
  manifest: {
    isRead: 'async',
    markRead: 'async',
    isReadObs: 'sync',
    // isUnreadThrough: 'source' // stream via this module to check unread state of msgs as you go?
  },
  init: function (server, config) {

    mkdirp.sync(join(config.path, 'unread'))
    const db = level(join(config.path, 'unread'), {
      valueEncoding: charwise
    })

    const STARTED_AT = 'startedAt'
    var startedAt
    db.get(STARTED_AT, (err, ts) => {
      if (ts) {
        startedAt = ts
        return
      }

      startedAt = Date.now
      db.put(STARTED_AT, startedAt)
    })

    const VERSION = 0
    server._flumeUse('unread-dummy-index', flumeView(
      VERSION,
      (_, msg) => {
        db.put(msg.key, null, noop)

        return _
        // HACK: leveraging flume to access stream of newest messages
      }
    ))

    // should take key?
    function isRead (key, cb) {
      db.get(key, (err, ts) => {
        if (err) cb(err)
        else cb(null, Boolean(ts))
      })
    }

    function markRead (key, cb = noop) {
      db.put(key, Date.now(), cb)
    }

    function isReadObs (key) {
      const obs = Value(null)
      isRead(key, (err, state) => {
        if (err) console.error(err)
        else obs.set(state)
      })

      // remember pull-level
      //   - could use for live updating ?

      return obs
    }

    return {
      isRead,
      markRead,
      isReadObs
    }
  }
}

function noop () {}
