import type { CollectionSlug, Config } from 'payload'
import { startSocketServer } from './socketServer.js'

type DefinedCollections = NonNullable<Config['collections']>

export type PayloadRealTimeConfig = {
    collections?: { [K in CollectionSlug]?: {
        room: (doc: Extract<DefinedCollections[number], { slug: K }>['fields']) => string | undefined
        events?: Array<'create' | 'update'>
    } }
    serverOptions?: { port?: 3001, cors?: { origin: '*', } }
    disabled?: boolean
}

export const payloadRealTime =
    (pluginOptions: PayloadRealTimeConfig) =>
        (config: Config): Config => {
            if (!config.collections) {
                config.collections = []
            }

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

                startSocketServer(payload, pluginOptions.serverOptions)

            }

            return config
        }
