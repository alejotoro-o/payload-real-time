import { Server } from 'socket.io'
import type { Payload } from 'payload'

type ServerOptions = {
    port?: number,
    cors?: { origin: string },
}

let io: Server | null = null

// Optional presence map (userId → socketId)
const onlineUsers = new Map<string, string>()

/**
 * Initializes and starts a Socket.IO server for real-time communication with Payload CMS.
 *
 * This server enables authenticated or unauthenticated WebSocket connections, supports presence tracking,
 * room-based messaging, and emits custom or collection-based events. It also attaches the Socket.IO instance
 * to the Payload object for use in hooks and plugins.
 *
 * @param payload - The Payload CMS instance, used for authenticating users and attaching the server.
 * @param serverOptions - Optional configuration for the Socket.IO server, including port and CORS origin.
 * @param requireAuth - If true, enforces JWT-based authentication for all socket connections. If false, allows anonymous access.
 *
 * @returns The initialized Socket.IO server instance.
 *
 * @example
 * ```ts
 * startSocketServer(payload, { port: 3001, cors: { origin: 'https://myapp.com' } }, true)
 * ```
 */

export const startSocketServer = (payload: Payload, serverOptions?: ServerOptions, requireAuth?: boolean) => {
    if (io) return io // prevent multiple instances

    io = new Server(serverOptions?.port || 3001, {
        cors: serverOptions?.cors || { origin: '*' },
    })

    io.use(async (socket, next) => {

        if (!requireAuth) {
            console.warn('Bypassing authentication (requireAuth: false)')
            return next()
        }

        const token = socket.handshake.auth?.token
        if (!token) return next(new Error('Missing token'))

        try {

            const headers = new Headers({
                Authorization: `JWT ${token}`,
            })
            const { user } = await payload.auth({ headers })

            if (!user) {
                console.warn('Auth resolved but no user returned')
                return next(new Error('Invalid token'))
            }

            socket.data.user = user
            next()
        } catch (err) {
            console.error('Socket auth failed:', err)
            next(new Error('Authentication failed'))
        }
    })


    io.on('connection', (socket) => {

        console.log(`New connection: ${socket.id}`)

        // Identify user
        socket.on('identify', (userId: string) => {
            onlineUsers.set(userId, socket.id)
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

        // Handle custom events
        socket.onAny((event, data) => {
            const { roomId, ...content } = data
            if (typeof roomId !== 'string') return
            io?.to(roomId).emit(event, content)
            console.log(`Relayed ${event} to ${roomId}`)
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