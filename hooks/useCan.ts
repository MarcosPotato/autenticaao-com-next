import { useAuth } from "../contexts/AuthContext"
import { validateUserPermissions } from "../utils/validateUserPermissions"

type UserCanParams = {
    permissions?: string[]
    roles?: string[]
}

export const useCan = ({ permissions, roles }: UserCanParams) => {
    const { user, isAuthenticated } = useAuth()

    if(!isAuthenticated){
        return false
    }

    if(!user){
        return false
    }

    const userHasValidPermissions = validateUserPermissions({
        user,
        permissions,
        roles
    })

    return userHasValidPermissions
}