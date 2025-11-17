import { useEffect, useRef, useState } from 'react'
import { PayloadRealtimeClient } from './RealtimeClient.js'

/**
 * useRealtime
 *
 * React hook for initializing and managing a PayloadRealtimeClient instance.
 * Automatically connects to the WebSocket server, identifies the user, and cleans up on unmount.
 *
 * @param userId - The unique identifier of the authenticated user. Used for presence tracking.
 * @param token - Optional JWT for authenticating the WebSocket connection. If omitted, connection may be unauthenticated depending on server config.
 *
 * @returns A connected PayloadRealtimeClient instance, or null if not yet initialized.
 *
 * @example
 * ```tsx
 * const client = useRealtime(user.id, user.token)
 * useEffect(() => {
 *   if (client) {
 *     client.join(`user:${user.id}`)
 *     client.onCollection('notifications', (data) => console.log('Notifications updated:', data))
 *   }
 * }, [client])
 * ```
 */
export const useRealtime = (userId: string, token?: string) => {
    const clientRef = useRef<PayloadRealtimeClient | null>(null)
    const [client, setClient] = useState<PayloadRealtimeClient | null>(null)

    useEffect(() => {
        const client = new PayloadRealtimeClient({
            url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001',
            token: token
        })
        client.identify(userId)
        clientRef.current = client
        setClient(client)

        return () => {
            client.disconnect()
            clientRef.current = null
            setClient(null)
        }
    }, [userId, token])

    return client
}