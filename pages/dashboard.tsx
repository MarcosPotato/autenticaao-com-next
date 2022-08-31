import type { NextPage } from 'next'
import { destroyCookie } from 'nookies'
import { useAuth } from '../contexts/AuthContext'
import { setupApiClient } from '../services/api'
import { AuthTokenError } from '../services/errors/AuthTokenError'
import { withSSRAuth } from '../utils/withSSRAuth'

const Dashboard: NextPage = () => {
    const { user } = useAuth()

    console.log(user)

    return (
        <h1>Dash</h1>
    )
}

export default Dashboard

export const getServerSideProps = withSSRAuth(async(context) => {
    const apiLCient = setupApiClient(context)
    try {
        const response = await apiLCient.get("/me")
    } catch (error) {
        destroyCookie(context, "nextauth.token")
        destroyCookie(context, "nextauth.refreshToken")
        
        return {
            redirect: {
                destination: "/",
                permanent: false
            }
        }
    }

    return {
        props: {}
    }
})