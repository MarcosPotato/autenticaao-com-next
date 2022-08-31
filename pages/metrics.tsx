import type { NextPage } from 'next'
import { setupApiClient } from '../services/api'
import { withSSRAuth } from '../utils/withSSRAuth'

const Metrics: NextPage = () => {
    return (
        <>
            <h1>Metrics</h1>
        </>
    )
}

export default Metrics

export const getServerSideProps = withSSRAuth(async(context) => {
    const apiLCient = setupApiClient(context)
    const response = await apiLCient.get("/me")



    return {
        props: {}
    }
},{
    permissions: ['metrics.list'],
    roles: ['administrator']
})