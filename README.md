# Payload Real-time Plugin

This plugin provides an implementation of websockets to enable real-time events in Payload CMS collections.

## Installation

Install the package running:

```
npm install @alejotoro-o/payload-real-time
```

## What This Plugin Does

- Emits real-time events when documents are created or updated.
- Scopes events to custom rooms (e.g. per user, per chat).
- Provides a React hook (`useRealtime`) for subscribing to events.
- Includes a flexible client for custom event handling.

## How to use the plugin

First configure the plugin in ```payload.config.ts```. The plugin accepts a configuration object with the following shape:

```ts
type PayloadRealTimeConfig = {
  collections?: Partial<Record<CollectionSlug, RealTimeCollectionOptions>>
  serverOptions?: {
    port?: number
    cors?: { origin: string }
  }
  disabled?: boolean
}
```

- `collections`: Define which collections should emit real-time events. For each collection, you can specify:

    - `events`: Limit which operations trigger events. Use `'create'`, `'update'`, or both. If omitted, all operations will emit.
    - `room`: A function that receives the document and returns a room string. This scopes the event to a specific room (e.g. `user:{userId}`).

```ts
type RealTimeCollectionOptions = {
  events?: Array<'create' | 'update'>
  room?: (doc: unknown) => string | undefined
}
```

- `serverOptions`: Customize the WebSocket server:

    - `port`: Port to run the server on (default is `3001`)
    - `cors`: CORS configuration (e.g. `{ origin: '*' }`)

- `disabled`: Set to `true` to disable the plugin entirely.

Here is an example configuring the plugin to emit events when documents are created or updated in the notifications collection.

```ts
import payloadRealTime from '@alejotoro-o/payload-real-time'

export const config = buildConfig({
    // ... Payload config options
    plugins: [
        // Additional plugins
        payloadRealTime({
            // Collections to enable real-time events
            collections: {
                notifications: {
                    // Room to emit events
                    room: (doc) => `user:${(doc as Notification).user}`,
                    // List of allowed events in afterChange hook
                    events: ['create', 'update'],
                }
            },
        }),
    ],
})
```

Use the ```useRealtime``` hook to subscribe to events in your frontend:

```ts
'use client'

import { useEffect, useState } from 'react'
import { useRealtime } from '@alejotoro-o/payload-real-time/client'

export const Component: React.FC = () => {

    const user = getUser() // Replace with your auth logic
    const realtime = useRealtime(user?.id.toString() ?? '')
    const [message, setMessage] = useState<string>()

    useEffect(() => {
        if (!user || !realtime) return

        realtime.join(`user:${user.id}`)

        realtime.onCollection('notifications', (data) => {
        console.log(data.data)
        setMessage(data.data.message)
        })
    }, [user, realtime])

    return (
        <div>
        {message && <p>🔔 {message}</p>}
        </div>
    )
}
```

## API Overview

### `useRealtime(userId: string, token?: string): PayloadRealtimeClient`

A React hook that initializes a real-time client, identifies the user for presence tracking, and returns a `PayloadRealtimeClient` instance.

Use this in components to manage socket lifecycle automatically:

```tsx
const realtime = useRealtime(user.id, user.token)
```

### `PayloadRealtimeClient`

You can also instantiate the client manually:

```ts
import { PayloadRealtimeClient } from '@alejotoro-o/payload-real-time'

const client = new PayloadRealtimeClient({ token })
```

#### Constructor Options

```ts
type RealtimeClientOptions = {
    url?: string        // WebSocket server URL (default: http://localhost:3001)
    token?: string      // Optional JWT for authentication
}
```

### Client Methods


| Method | Description |
|--------|-------------|
| `identify(userId: string)` | Identifies the user and registers them for presence tracking. Should be called once after connecting. |
| `join(roomId: string)` | Joins a specific room (e.g. `user:123`, `chat:abc`). Enables receiving events scoped to that room. |
| `leave(roomId: string)` | Leaves a previously joined room. Useful for cleaning up listeners when navigating away. |
| `onCollection(slug: string, callback: (data) => void)` | Subscribes to real-time events for a specific collection. Events are emitted as `realtime:{slug}`. |
| `on(event: string, callback: (data) => void)` | Subscribes to any custom event. Useful for chat messages, typing indicators, etc. |
| `emit(event: string, data: any)` | Emits a custom event to the server. The payload should include a `roomId` if it's meant to be scoped. |
| `disconnect()` | Gracefully disconnects the socket. Useful on logout or component unmount. |

### Example: Custom Event

```ts
client.emit('chat-message', {
    roomId: 'chat:abc123',
    content: 'Hello world!',
})
```

```ts
client.on('chat-message', (data) => {
    console.log('New message:', data.content)
})
```

## Server-side Usage

The plugin attaches the Socket.IO server instance to `payload.io`, allowing you to emit events from any hook or endpoint:

```ts
const io = (payload as any).io

io.to(`user:${userId}`).emit('custom-event', { message: 'Hello!' })
```
