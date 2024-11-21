
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permission.decorator";
import { CacheConfigService } from "src/config/caching/config.service";

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private cacheConfigService: CacheConfigService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) return true;

        const request = context.switchToHttp().getRequest();
        const userId = request.user?.sub;

        const cachedUser = await this.cacheConfigService.getFromCache<{ permissions: string[] }>(`user:${userId}`);

        if (!cachedUser) {
            throw new ForbiddenException({
                errorCode: "PERMISSIONS_NOT_FOUND",
                message: "No se encontraron permisos en la caché para este usuario.",
            });
        }

        const userPermissions = cachedUser.permissions;
        const hasPermission = requiredPermissions.every(permission => userPermissions.includes(permission));

        if (!hasPermission) {
            throw new UnauthorizedException({
                errorCode: "INSUFFICIENT_PERMISSIONS",
                message: "No tienes los permisos necesarios para acceder a este recurso.",
            });
        }

        return true;
    }
}
