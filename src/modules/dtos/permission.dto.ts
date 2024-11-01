import { IsNotEmpty, IsString } from "class-validator";

export class PermissionDto {
    @IsString()
    @IsNotEmpty()
    permissionName: string;

    @IsString()
    description: string;
}