import type { Payload } from 'payload'

import { devUser, user1, user2 } from './helpers/credentials.js'

export const seed = async (payload: Payload) => {
  const { totalDocs } = await payload.count({
    collection: 'users',
    where: {
      email: {
        equals: devUser.email,
      },
    },
  })

  if (!totalDocs) {
    await payload.create({
      collection: 'users',
      data: devUser,
    })

    await payload.create({
      collection: 'users',
      data: user1,
    })

    await payload.create({
      collection: 'users',
      data: user2,
    })
  }
}
