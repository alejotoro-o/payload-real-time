# Payload Real-time Plugin

This plugin provides an implementation of websockets to enable real-time events in Payload CMS collections.

## Installation

```
npm install payload-real-time
```

## How to use the plugin

```payload.config.ts```

```ts
import payloadRealTime from 'payload-real-time'

export const config = buildConfig({
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

```component.ts```

```ts
import { useEffect, useState } from "react"
import { useRealtime } from "../../../src/client/useRealtime.js"

export const Component: React.FC = () => {

    const user = getUser() // Get user this can be done with auth or a useEffect hook
    const realtime = useRealtime(user?.id.toString() ?? '')
    const [message, setMessage] = useState()

    // Other functions and hooks

    useEffect(() => {
        if (!user || !realtime) return
        realtime.join(`user:${user.id}`)
        realtime.onCollection('notifications', (data) => {
            console.log(data.data)
            setMessage(data.data.message)
        })
    }, [user, realtime])

    return (
        // Component logic
    )

}
```