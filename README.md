# ssb-unread

A scuttlebot plugin which tracks read / unread state of all received messages in a mutable level db.
The intention is to provide a persistent store which can be referenced and contributed to by a plurality of client interfaces.

## Install

```js
var sbot = require('scuttlebot')
  .use(require('scuttlebot/plugins/master'))
  .use(require('scuttlebot/plugins/gossip'))
  .use(require('scuttlebot/plugins/replicate'))
  .use(require('scuttlebot/plugins/invite'))
  .use(require('scuttlebot/plugins/local'))
  .use(require('ssb-unread'))   // <<
  .call(null, config)
```

## API

### `sbot.unread.isRead(key, cb)`

provide a message key and get a boolean response back in the callback

### `sbot.unread.markRead(key, cb)`

mark a message key as read

