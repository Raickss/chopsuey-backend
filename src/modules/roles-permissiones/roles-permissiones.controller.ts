import { Controller } from '@nestjs/common';
import { RolesPermissionesService } from './roles-permissiones.service';

@Controller('roles-permissiones')
export class RolesPermissionesController {
  constructor(private readonly rolesPermissionesService: RolesPermissionesService) {}
}
