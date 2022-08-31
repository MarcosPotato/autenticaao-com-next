import axios, { AxiosError } from "axios";
import { GetServerSidePropsContext } from "next";
import { parseCookies, setCookie } from 'nookies'
import { signOut } from "../contexts/AuthContext";
import { AuthTokenError } from "./errors/AuthTokenError";

type RequestQueue = {
    onSuccess: (token: string) => void
    onFailed: (err: AxiosError) => void
}


let isRefreshing = false
let failedRequestsQueue: RequestQueue[] = []

export function setupApiClient(context: GetServerSidePropsContext | undefined = undefined){
    let cookies = parseCookies(context)


    const api = axios.create({
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
            
            if(data.code === "token.expired"){
                console.log("oi")
                cookies = parseCookies(context)
    
                const {"nextauth.refreshToken": refreshToken } = cookies
                const originalConfig = error.config
    
                if(!isRefreshing){
                    isRefreshing = true
    
                    api.post("/refresh", { refreshToken })
                        .then(response => {
                            const { token, refreshToken } = response.data
        
                            setCookie(context, "nextauth.token", token, {
                                maxAge: 60 * 60 * 24 * 30, //30 dias
                                path: "/"
                            })
        
                            setCookie(context, "nextauth.refreshToken", refreshToken, {
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
    
                            if(process.browser){
                                signOut()
                            }
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
                if(process.browser){
                    signOut()
                } else{
                    throw new AuthTokenError()
                }
            }
        }
    
        throw error
    })

    return api
}