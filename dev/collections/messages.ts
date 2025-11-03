import { CollectionConfig } from "payload";

export const Messages: CollectionConfig = {
    slug: 'messages',
    fields: [
        {
            name: 'message',
            type: 'text',
            required: true,
        },
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
        }
    ]
}