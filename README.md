# Payload Real-time Plugin

This plugin provides an implementation of websockets to enable real-time events in Payload CMS collections.

## Installation

Install the package running:

```sh
npm install @alejotoro-o/payload-real-time
```

**NOTE:** On some implementation you can get the error ```[TypeError: bufferUtil.unmask is not a function]```, in that case you need to install the ```bufferutil``` package with ```        npm install bufferutil```.

## What This Plugin Does

- Emits real-time events when documents are created or updated.
- Scopes events to custom rooms (e.g. per user, per chat).
- Provides a React hook (`useRealtime`) for subscribing to events.
- Includes a flexible client for custom event handling.

## How to use the plugin

First configure the plugin in ```payload.config.ts```. The plugin accepts a configuration object with the following shape:

```ts
export type PayloadRealTimeConfig = {
    collections?: { [K in CollectionSlug]?: {
        room: (doc: Extract<DefinedCollections[number], { slug: K }>['fields']) => string | undefined
        events?: Array<'create' | 'update'>
    } }
    serverOptions?: {
        port?: number,
        cors?: {
            origin: string | string[],
            methods?: string | string[],
        }
    }
    requireAuth?: boolean,
    disabled?: boolean,
}
```

- `collections`: Define which collections should emit real-time events. For each collection, you can specify:

    - `events`: Limit which operations trigger events. Use `'create'`, `'update'`, or both. If omitted, all operations will emit.
    - `room`: A function that receives the document and returns a room string. This scopes the event to a specific room (e.g. `user:{userId}`).

- `serverOptions`: Customize the WebSocket server:

    - `port`: Port to run the server on (default is `3001`)
    - `cors`: CORS configuration (e.g. `{ origin: '*' }`)

- `requireAuth`: Set to `true` to enable JWT authentication for socket connections. Default is `false`.
- `disabled`: Set to `true` to disable the plugin entirely.

Here is an example configuring the plugin to emit events when documents are created or updated in the notifications collection.

```ts
import payloadRealTime from '@alejotoro-o/payload-real-time'

export const config = buildConfig({
    // ... Payload config options
    plugins: [
        payloadRealTime({
            collections: {
                notifications: {
                    room: (doc: Notification) => {
                        const user = doc.user
                        const userId = typeof user === 'number' ? user : user?.id
                        return userId ? `user:${userId}` : undefined
                    },
                    events: ['create', 'update'],
                },
            },
            requireAuth: true
        }),
    ],
})
```

Use the ```useRealtime``` hook to subscribe to events in your frontend:

```ts
'use client'

import { User } from "payload-types.js"
import { useEffect, useState } from "react"
import { useRealtime } from "../../../src/client/useRealtime.js"

export default function Page() {

    const [user, setUser] = useState<User>()
    const [token, setToken] = useState()
    const realtime = useRealtime(user?.id.toString() ?? '', token ?? '')
    const [message, setMessage] = useState()

    useEffect(() => {
        const getUser = async () => {
            const response = await fetch('http://localhost:3000/api/users/me')
            if (response.ok) {
                const user = await response.json()
                setUser(user.user)
                setToken(user.token)
            } else {
                console.log('Error')
            }
        }
        getUser()
    }, [])

    // Websockets
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
            <div>
                {user?.email}
            </div>
            <div>
                {message}
            </div>
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

const client = new PayloadRealtimeClient({ url, token })
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
