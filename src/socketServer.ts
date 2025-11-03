import { Server } from 'socket.io'
import type { Payload } from 'payload'

type ServerOptions = {
    port?: number,
    cors?: { origin: string },
}

let io: Server | null = null

// Optional presence map (userId → socketId)
const onlineUsers = new Map<string, string>()

export const startSocketServer = (payload: Payload, serverOptions?: ServerOptions) => {
    if (io) return io // prevent multiple instances

    io = new Server(serverOptions?.port || 3001, {
        cors: serverOptions?.cors || { origin: '*' },
    })

    io.on('connection', (socket) => {
        console.log(`New connection: ${socket.id}`)

        // Identify user (optional)
        socket.on('identify', (userId: string) => {
            onlineUsers.set(userId, socket.id)
            socket.join(`user:${userId}`)
            console.log(`${userId} is online`)
        })

        // Join arbitrary room
        socket.on('join', (roomId: string) => {
            socket.join(roomId)
            console.log(`Joined room: ${roomId}`)
        })

        // Leave room
        socket.on('leave', (roomId: string) => {
            socket.leave(roomId)
            console.log(`Left room: ${roomId}`)
        })

        // Handle chat messages
        socket.on('chat-message', (data) => {
            io?.to(data.roomId).emit('chat-message', data)
        })

        // Disconnect cleanup
        socket.on('disconnect', () => {
            for (const [userId, id] of onlineUsers.entries()) {
                if (id === socket.id) {
                    onlineUsers.delete(userId)
                    console.log(`${userId} went offline`)
                    break
                }
            }
        })
    })

        // Attach to Payload for use in hooks
        ; (payload as any).io = io

    console.log('Socket.IO server running on port 3001')
    return io
}