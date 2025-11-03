import { io, Socket } from 'socket.io-client'

export type RealtimeClientOptions = {
    url?: string // default: http://localhost:3001
    token?: string // optional JWT
}

export class PayloadRealtimeClient {
    private socket: Socket

    constructor({ url = 'http://localhost:3001', token }: RealtimeClientOptions = {}) {
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
    onCollection(slug: string, callback: (payload: any) => void) {
        this.socket.on(`realtime:${slug}`, callback)
    }

    // Subscribe to chat messages
    onChatMessage(callback: (data: any) => void) {
        this.socket.on('chat-message', callback)
    }

    // Send a chat message
    sendChatMessage(roomId: string, content: string) {
        this.socket.emit('chat-message', { roomId, content })
    }

    // Disconnect
    disconnect() {
        this.socket.disconnect()
    }
}