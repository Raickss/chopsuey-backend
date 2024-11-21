export const Permissions = {
    user: {
        createUser: "CREATE_USER",
        fetchAllUsers: "FETCH_ALL_USERS",
        findUserById: "FIND_USER_BY_ID",
        findUserByUsername: "FIND_USER_BY_USERNAME",
        findUserByEmail: "FIND_USER_BY_EMAIL",
        updateUser: "UPDATE_USER",
        assignRole: "ASSIGN_ROLE",
        removeUser: "REMOVE_USER"
    },
    role: {
        createRole: "CREATE_ROLE",
        fetchAllRoles: "FETCH_ALL_ROLES",
        findRoleById: "FIND_ROLE_BY_ID",
        updateRole: "UPDATE_ROLE",
        removeRole: "REMOVE_ROLE"
    },
    rolePermission: {
        viewAllRolesPermissions: "VIEW_ALL_ROLES_PERMISSIONS",
        viewPermissionsByRole: "VIEW_PERMISSIONS_BY_ROLE",
        assignPermissionsToRole: "ASSIGN_PERMISSIONS_TO_ROLE",
        updatePermissionsForRole: "UPDATE_PERMISSIONS_FOR_ROLE",
        removePermissionsFromRole: "REMOVE_PERMISSIONS_FROM_ROLE",
        clearPermissionsForRole: "CLEAR_PERMISSIONS_FOR_ROLE"
    },
    permission: {
        createPermission: "CREATE_PERMISSION",
        fetchAllPermissions: "FETCH_ALL_PERMISSIONS",
        findPermissionById: "FIND_PERMISSION_BY_ID",
        updatePermission: "UPDATE_PERMISSION",
        removePermission: "REMOVE_PERMISSION"
    }
};
