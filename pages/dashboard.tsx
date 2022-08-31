import type { NextPage } from 'next'
import { useAuth } from '../contexts/AuthContext'

const Dashboard: NextPage = () => {
    const { user } = useAuth()

    console.log(user)

    return (
        <h1>Dash</h1>
    )
}

export default Dashboard
