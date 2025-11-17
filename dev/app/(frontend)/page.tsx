'use client'

import { User } from "payload-types.js"
import { useEffect, useState } from "react"
import { useRealtime } from "../../../src/client/useRealtime.js"

export default function Page() {

    const [user, setUser] = useState<User>()
    const [token, setToken] = useState()
    const realtime = useRealtime(user?.id.toString() ?? '', token ?? '')
    const [message, setMessage] = useState()

    useEffect(() => {
        const getUser = async () => {
            const response = await fetch('http://localhost:3000/api/users/me')
            if (response.ok) {
                const user = await response.json()
                setUser(user.user)
                setToken(user.token)
            } else {
                console.log('Error')
            }
        }
        getUser()
    }, [])

    // Websockets
    useEffect(() => {
        if (!user || !realtime) return
        realtime.join(`user:${user.id}`)
        realtime.onCollection('notifications', (data) => {
            console.log(data.data)
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