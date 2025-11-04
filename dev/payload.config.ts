import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadRealTime } from 'payload-real-time'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'
import { Notifications } from 'collections/notifications.js'
import { Notification } from 'payload-types.js'
import { Users } from 'collections/users.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
    process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
    if (process.env.NODE_ENV === 'test') {
        const memoryDB = await MongoMemoryReplSet.create({
            replSet: {
                count: 3,
                dbName: 'payloadmemory',
            },
        })

        process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
    }

    return buildConfig({
        admin: {
            user: Users.slug,
            importMap: {
                baseDir: path.resolve(dirname),
            },
        },
        collections: [
            Notifications,
            Users
        ],
        db: sqliteAdapter({
            client: {
                url: process.env.DATABASE_URI || ''
            }
        }),
        editor: lexicalEditor(),
        email: testEmailAdapter,
        onInit: async (payload) => {
            await seed(payload)
        },
        plugins: [
            payloadRealTime({
                collections: {
                    notifications: {
                        room: (doc) => `user:${(doc as Notification).user}`,
                        events: ['create', 'update'],
                    }
                },
            }),
        ],
        secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
        sharp,
        typescript: {
            outputFile: path.resolve(dirname, 'payload-types.ts'),
        },
    })
}

export default buildConfigWithMemoryDB()
