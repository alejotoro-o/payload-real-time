'use client'

import { User } from "payload-types.js"
import { useEffect, useMemo, useState } from "react"
import { useRealtime } from "../../../src/client/useRealtime.js"

export default function Page() {

    const [user, setUser] = useState<User>()
    const realtime = useRealtime(user?.id.toString() ?? '')
    const [message, setMessage] = useState()

    useEffect(() => {
        const getUser = async () => {
            const response = await fetch('http://localhost:3000/api/users/me')
            if (response.ok) {
                const user = await response.json()
                setUser(user.user)
            } else {
                console.log('Error')
            }
        }
        getUser()
    }, [])

    // Websockets
    useEffect(() => {
        if (!user || !realtime) return
        realtime.onCollection('messages', (data) => {
            console.log(`New message: ${data.data.message}`)
            setMessage(data.data.message)
        })
    }, [user, realtime])

    return (
        <div>
            <div>
                {user?.email}
            </div>
            <div>
                {message}
            </div>
        </div>
    )
}