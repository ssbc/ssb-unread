const flumeView = require('flumeview-reduce')
const mkdirp = require('mkdirp')
const { join } = require('path')
const level = require('level')
const charwise = require('charwise')
const { isMsg } = require('ssb-ref')

module.exports = {
  name: 'unread',
  version: require('./package.json').version,
  manifest: {
    isRead: 'async',
    markRead: 'async'
    // isUnreadThrough: 'source' // stream via this module to check unread state of msgs as you go?
  },
  init: function (server, config) {
    mkdirp.sync(join(config.path, 'unread'))
    const db = level(join(config.path, 'unread'), {
      valueEncoding: charwise
    })
    server.close.hook(function (fn, args) {
      db.close()

      return fn.apply(this, args)
    })

    markDbBirth(db)

    const VERSION = 1
    server._flumeUse('unread-dummy-index', flumeView(
      VERSION,
      (_, msg) => {
        db.put(msg.key, null, noop)

        return _
        // HACK: leveraging flume to access stream of newest messages
      }
    ))

    function isRead (key, cb) {
      if (!isMsg(key)) return cb(null, new Error('ssb-unread requires a valid message key'))

      db.get(key, (err, ts) => {
        if (err) cb(err)
        else cb(null, Boolean(ts))
      })
    }

    function markRead (key, cb = noop) {
      if (!isMsg(key)) return cb(null, new Error('ssb-unread requires a valid message key'))

      db.put(key, Date.now(), cb)
    }

    return {
      isRead,
      markRead
    }
  }
}

function markDbBirth (db) {
  const STARTED_AT = 'startedAt'
  db.get(STARTED_AT, (err, ts) => {
    if (err && err.type !== 'NotFoundError') {
      return console.error(err)
    } else if (err === null) {
      return // nothing to do
    }

    db.put(STARTED_AT, Date.now())
  })
}

function noop () {}
