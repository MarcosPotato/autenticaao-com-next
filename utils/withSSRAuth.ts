import jwtDecode from "jwt-decode";
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";
import { validateUserPermissions } from "./validateUserPermissions";

type WithSSRAuthOptions = {
    permissions: string[]
    roles: string[]
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions) {
    return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
        const cookies = parseCookies(context)
        const token = cookies['nextauth.token']
    
        if(!token){
            return {
                redirect: {
                    destination: "/",
                    permanent: false
                }
            }
        }

        if(!!options){
            const user = jwtDecode<{ permissions: string[], roles: string[] }>(token)

            const userHasValidPermissions = validateUserPermissions({
                user,
                permissions: options.permissions,
                roles: options.roles
            })

            if(!userHasValidPermissions){
                return {
                    redirect: {
                        destination: "/dashboard",
                        permanent: false
                    }
                }
            }
        }

        try {
            return await fn(context)
        } catch (error) {
            if(error instanceof AuthTokenError){
                destroyCookie(context, "nextauth.token")
                destroyCookie(context, "nextauth.refreshToken")
                
                return {
                    redirect: {
                        destination: "/",
                        permanent: false
                    }
                }
            }

            throw error
        }

    }
}