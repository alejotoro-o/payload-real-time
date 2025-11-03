import { CollectionConfig } from "payload";

export const Notifications: CollectionConfig = {
    slug: 'Notifications',
    fields: [
        {
            name: 'message',
            type: 'relationship',
            relationTo: 'messages'
        }
    ]
}