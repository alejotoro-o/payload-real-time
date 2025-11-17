import { io, Socket } from 'socket.io-client'

export type RealtimeClientOptions = {
    url?: string // default: http://localhost:3001
    token?: string // optional JWT
}

/**
 * PayloadRealtimeClient
 * 
 * A lightweight Socket.IO wrapper for interacting with the Payload Realtime plugin.
 * Enables presence tracking, room-based messaging, and collection-level subscriptions.
 * 
 * @example
 * ```ts
 * const client = new PayloadRealtimeClient({ token: 'your-jwt' })
 * client.identify(user.id)
 * client.join(`user:${user.id}`)
 * client.onCollection('posts', (data) => console.log('Post updated:', data))
 * ```
 * 
 * @param url - WebSocket server URL. Defaults to 'ws://localhost:3001'.
 * @param token - Optional JWT for authenticating the socket connection.
 */
export class PayloadRealtimeClient {
    private socket: Socket

    constructor({ url = 'ws://localhost:3001', token }: RealtimeClientOptions = {}) {
        this.socket = io(url, {
            auth: token ? { token } : undefined,
        })
    }

    // Identify user for presence tracking
    identify(userId: string) {
        this.socket.emit('identify', userId)
    }

    // Join a room (e.g. user, chat, listing)
    join(roomId: string) {
        this.socket.emit('join', roomId)
    }

    // Leave a room
    leave(roomId: string) {
        this.socket.emit('leave', roomId)
    }

    // Subscribe to collection events
    onCollection(slug: string, callback: (data: any) => void) {
        this.socket.on(`realtime:${slug}`, callback)
    }

    // Subscribe to any custom event
    on(event: string, callback: (data: any) => void) {
        this.socket.on(event, callback)
    }

    // Emit any custom event
    emit(event: string, data: any) {
        this.socket.emit(event, data)
    }

    // Disconnect
    disconnect() {
        this.socket.disconnect()
    }
}