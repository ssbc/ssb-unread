# ssb-unread

A ssb-server plugin which tracks read / unread state of all received messages in a mutable level db.
The intention is to provide a persistent store which can be referenced and contributed to by a plurality of client interfaces.

Note that this unread state is "off-chain", as in it's not stored in your log, so others won't be able to see it, and if you lose your computer you won't be able to recover your unread record.

## API

### `sbot.unread.isRead(key, cb)`

Provide a message key and get a boolean response back in the callback

### `sbot.unread.markRead(key, cb)`

mark a message key as read


## Example Usage

```js
var Server = require('ssb-server')
var Config = require('ssb-config/inject')

Server
  .use(require('ssb-server/plugins/master'))
  .use(require('ssb-unread'))   // <<

var server = Server(Config())

var msgId = '%fJ900xKrMIJ1NM09V05z++GLy92O9NP9Hh5hpM1MeA4=.sha256'
server.unread.isRead(msgId, (err, bool) => {
  console.log(msgId, 'has been read:', bool)
})
```

## Example Usage (more complete)

```js
// server.js 
var Server = require('ssb-server')
var Config = require('ssb-config/inject')

Server
  .use(require('ssb-server/plugins/master'))
  .use(require('ssb-backlinks'))
  .use(require('ssb-unread'))   // <<

var server = Server(Config())
```

```js
// client.js  (connecting remotely from front end to back end)
var Client = require('ssb-client')
var Config = require('ssb-config/inject')
var pull = require('pull-stread')
var pullParallelMap = require('pull-paramap')

var config = Config()

Client(config.keys, config, (err, server) => {
  pull(
    pullMentions(server),
    pullParallelMap((msg, cb) => {
      server.unread.isRead(msg.key, (err, bool) => {
        if (bool) cb(null, null) // drop the read messages
        else cb(null, msg)
      })
    }),
    pull.filter(Boolean), // filter out the null entries
    pull.take(20), // don't pull the whole database!
    pull.collect((err, unreadMentions) => {
      // ... do something
    })
  })
})

function pullMentions (server, feedId) {
  return server.backlinks.read({
    query: [{ 
      $filter: {
        dest: server.id, // mentions about me
      }
    }],
    reverse: true,
    live: false
  })
  // Note this likely needs validation + sorting!
}
```
