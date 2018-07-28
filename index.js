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
    isUnread: 'async',
    markRead: 'async',
    unreadObs: 'sync',
    // stream: 'source'
  },
  init: function (server, config) {

    mkdirp.sync(join(config.path, 'unread'))
    const db = level(join(config.path, 'unread'), {
      valueEncoding: charwise
    })

    const STARTED_AT = 'startedAt'
    db.get(STARTED_AT, (err, ts) => {
      if (!ts) db.put(STARTED_AT, Date.now())
      
      // console.log(new Date(ts))
      // db.put(STARTED_AT, Number(new Date(2018, 6, 1)))

      // NOTE: just using flume to get an up to date list of all messages piped to ssb-unread!
      const VERSION = 1
      var queue = []
      server._flumeUse('unread-dummy-index', flumeView(
        VERSION,
        (_, msg) => {
          db.put(msg.key, null, noop)

          return _
        }
      ))
    })

    function isUnread (key, cb) {
      return db.get(key, (err, ts) => {
        if (err) cb(err)
        else cb(null, Boolean(ts))
      })
    }

    function markRead (key, cb = noop) {
      db.put(key, Date.now(), cb)
    }

    function unreadObs (key) {
      const obs = Value(null)
      isUnread(key, (err, state) => {
        if (err) console.error(err)
        else obs.set(state)
      })

      // remember pull-level
      //   - could use for live updating ?

      return obs
    }

    return {
      isUnread,
      markRead,
      unreadObs
    }
  }
}

function noop () {}
