import type { CollectionSlug, Config } from 'payload'
import { startSocketServer } from './socketServer.js'

type DefinedCollections = NonNullable<Config['collections']>

export type PayloadRealTimeConfig = {
    collections?: { [K in CollectionSlug]?: {
        room: (doc: Extract<DefinedCollections[number], { slug: K }>['fields']) => string | undefined
        events?: Array<'create' | 'update'>
    } }
    serverOptions?: {
        port?: number,
        cors?: {
            origin: string | string[],
            methods: string | string[],
        }
    }
    requireAuth?: boolean,
    disabled?: boolean,
}

/**
 * Payload Realtime Plugin
 * Enables real-time event broadcasting via Socket.IO for configured collections.
 *
 * @param pluginOptions - Configuration object for the realtime plugin.
 * Includes:
 * - `collections`: Per-collection room resolver and event triggers.
 * - `serverOptions`: Port and CORS settings for the WebSocket server.
 * - `requireAuth`: Whether to enforce JWT authentication for connections.
 * - `disabled`: Whether to disable the plugin entirely.
 *
 * @returns A Payload config enhancer that wires up realtime hooks and starts the WebSocket server.
 */
export const payloadRealTime =
    (pluginOptions: PayloadRealTimeConfig) =>
        (config: Config): Config => {
            if (!config.collections) {
                config.collections = []
            }

            pluginOptions.requireAuth = pluginOptions.requireAuth ?? false

            if (pluginOptions.collections) {
                for (const collectionSlug in pluginOptions.collections) {
                    const collection = config.collections.find(
                        (collection) => collection.slug === collectionSlug,
                    )

                    if (collection) {
                        const options = pluginOptions.collections[collectionSlug]

                        if (!collection.hooks) {
                            collection.hooks = {}
                        }

                        if (!collection.hooks.afterChange) {
                            collection.hooks.afterChange = []
                        }

                        collection.hooks.afterChange.push(
                            async ({ doc, req, operation }) => {

                                const io = (req.payload as any).io
                                if (!io) return

                                // Check if operation is allowed
                                const allowedOps = options?.events ?? ['create', 'update']
                                if (!allowedOps.includes(operation)) return

                                // Determine room (if any)
                                let room: string | undefined
                                try {
                                    room = typeof options?.room === 'function' ? options.room(doc) : undefined
                                } catch (err) {
                                    console.warn(`Realtime plugin: room function error for ${collectionSlug}`, err)
                                }

                                const data = {
                                    operation,
                                    collection: collectionSlug,
                                    data: doc,
                                }

                                // Emit to room or globally
                                if (room) {
                                    io.to(room).emit(`realtime:${collectionSlug}`, data)
                                } else {
                                    io.emit(`realtime:${collectionSlug}`, data)
                                }
                            }
                        )
                    }
                }
            }

            /**
             * If the plugin is disabled, we still want to keep added collections/fields so the database schema is consistent which is important for migrations.
             * If your plugin heavily modifies the database schema, you may want to remove this property.
             */
            if (pluginOptions.disabled) {
                return config
            }

            const incomingOnInit = config.onInit

            config.onInit = async (payload) => {
                // Ensure we are executing any existing onInit functions before running our own.
                if (incomingOnInit) {
                    await incomingOnInit(payload)
                }

                startSocketServer(payload, pluginOptions.serverOptions, pluginOptions.requireAuth)

            }

            return config
        }
