import { useEffect, useRef, useState } from 'react'
import { PayloadRealtimeClient } from './RealtimeClient.js'


export const useRealtime = (userId: string, token?: string) => {
    const clientRef = useRef<PayloadRealtimeClient | null>(null)
    const [client, setClient] = useState<PayloadRealtimeClient | null>(null)

    useEffect(() => {
        const client = new PayloadRealtimeClient({ token })
        client.identify(userId)
        client.join(`user:${userId}`)
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