import type { NextPage } from 'next'
import { Can } from '../components/Can'
import { useAuth } from '../contexts/AuthContext'
import { setupApiClient } from '../services/api'
import { withSSRAuth } from '../utils/withSSRAuth'

const Dashboard: NextPage = () => {

    const { signOut } = useAuth()

    return (
        <>
            <h1>Dash</h1>
            <button onClick={ signOut }>SignOut</button>
            <Can permissions={['metrics.list']}>
                <div>
                    <p>Métricas</p>
                </div>
            </Can>
        </>
    )
}

export default Dashboard

export const getServerSideProps = withSSRAuth(async(context) => {
    const apiLCient = setupApiClient(context)
    const response = await apiLCient.get("/me")

    return {
        props: {}
    }
})