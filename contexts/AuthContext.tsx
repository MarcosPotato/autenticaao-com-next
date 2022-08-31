import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { destroyCookie, parseCookies, setCookie } from 'nookies'
import Router from "next/router";
import { api } from '../services/apiClient'

type User = {
    email: string,
    permissions: string[]
    roles: string[]
}

type SigInCredentials = {
    email: string
    password: string
}

type AuthContextData  = {
    user: User | null
    signIn(credentials: SigInCredentials): Promise<void>
    signOut(): void
    isAuthenticated: boolean
}

type AuthContextProviderProps = {
    children?: ReactNode
}

const AuthContext = createContext({} as AuthContextData)
let authChannel: BroadcastChannel

export const signOut = () => {
    destroyCookie(undefined, "nextauth.token")
    destroyCookie(undefined, "nextauth.refreshToken")

    authChannel.postMessage("signOut")

    Router.push("/")
}


export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const isAuthenticated = !!user

    useEffect(() => {
        const { "nextauth.token": token } = parseCookies()

        if(token){
            api.get("/me")
                .then(response => {
                    const { email, permissions, roles } = response.data

                    setUser({
                        email, 
                        permissions, 
                        roles
                    })

                    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
                })
                .catch(error => {
                    signOut()
                })
        }
    },[])

    /* useEffect(() => {
        authChannel = new BroadcastChannel("auth")
        authChannel.onmessage = (message) => {
            switch(message.data){
                case "signOut":
                    signOut()
                    break
                default: 
                    break
            }
        }
    },[]) */

    const signIn = async({ email, password }: SigInCredentials) => {
        try {
            const response = await api.post("/sessions", {
                email,
                password
            })
    
            const { permissions, roles, token, refreshToken } = response.data

            setCookie(undefined, "nextauth.token", token, {
                maxAge: 60 * 60 * 24 * 30, //30 dias
                path: "/"
            })

            setCookie(undefined, "nextauth.refreshToken", refreshToken, {
                maxAge: 60 * 60 * 24 * 30, //30 dias
                path: "/"
            })
            
            setUser({
                email,
                permissions,
                roles
            })
            Router.push("/dashboard")
            
        } catch (error: any) {
            console.log(error.response)
        }
    }

    return (
        <AuthContext.Provider value={{ user, signIn, isAuthenticated, signOut }}>
            { children }
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)

    if(!context){
        throw new Error("Falha")
    }

    return context
}