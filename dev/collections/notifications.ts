import { CollectionConfig } from "payload";

export const Notifications: CollectionConfig = {
    slug: 'notifications',
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