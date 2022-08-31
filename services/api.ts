import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from 'nookies'
import { signOut } from "../contexts/AuthContext";

type RequestQueue = {
    onSuccess: (token: string) => void
    onFailed: (err: AxiosError) => void
}

let cookies = parseCookies()
let isRefreshing = false
let failedRequestsQueue: RequestQueue[] = []

export const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
        Authorization: `Bearer ${cookies["nextauth.token"]}`
    },  
})

api.interceptors.response.use((config) => {
    return config   
}, (error: AxiosError) => {
    if(error.response?.status === 401){
        const data = error.response.data as any
        console.log(data.code)
        if(data.code === "token.expired"){
            console.log("oi")
            cookies = parseCookies()

            const {"nextauth.refreshToken": refreshToken } = cookies
            const originalConfig = error.config

            if(!isRefreshing){
                isRefreshing = true

                api.post("/refresh", { refreshToken })
                    .then(response => {
                        const { token, refreshToken } = response.data
    
                        setCookie(undefined, "nextauth.token", token, {
                            maxAge: 60 * 60 * 24 * 30, //30 dias
                            path: "/"
                        })
    
                        setCookie(undefined, "nextauth.refreshToken", refreshToken, {
                            maxAge: 60 * 60 * 24 * 30, //30 dias
                            path: "/"
                        })
    
                        api.defaults.headers.common["Authorization"] = `Bearer ${token}`

                        failedRequestsQueue.forEach(request => request.onSuccess(token))
                        failedRequestsQueue = []
                    })
                    .catch(error => {
                        failedRequestsQueue.forEach(request => request.onFailed(error))
                        failedRequestsQueue = []
                    })
                    .finally(() => isRefreshing = false)
            }

            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    onSuccess: (token: string) => {
                        if(originalConfig.headers){
                            originalConfig.headers["Authorization"] = `Bearer ${token}`
                        } else{
                            originalConfig.headers = {
                                Authorization: `Bearer ${token}`
                            }
                        }

                        resolve(api(originalConfig))
                    },
                    onFailed: (err: AxiosError) => {
                        reject(err)
                    },
                })
            })
        } else{
            signOut()
        }
    }

    throw error
})