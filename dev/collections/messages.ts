import { CollectionConfig } from "payload";

export const Messages: CollectionConfig = {
    slug: 'messages',
    hooks: {
        afterChange: [
            async ({ req, doc }) => {
                await req.payload.create({
                    collection: 'notifications',
                    data: {
                        message: `New message from ${req.user?.id}`,
                        user: doc.target
                    }
                })
            }
        ]
    },
    fields: [
        {
            name: 'message',
            type: 'text',
            required: true,
        },
        {
            name: 'target',
            type: 'relationship',
            relationTo: 'users',
            required: true,
        }
    ]
}