// src/decorators/permissions.decorator.ts
import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { PermissionGuard } from "../guards/permission.guard";


export const PERMISSIONS_KEY = 'permissions';

export function RequiredPermissions(...permissions: string[]) {
    return applyDecorators(
        SetMetadata(PERMISSIONS_KEY, permissions),
        UseGuards(PermissionGuard)
    );
}
