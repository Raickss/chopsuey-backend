import { IsNumber, IsArray, ArrayNotEmpty, IsInt, Min } from 'class-validator';

export class RolePermissionDto {
  @IsNumber()
  @IsInt()
  @Min(1)
  roleId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  permissionIds: number[];
}
