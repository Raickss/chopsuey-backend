import { IsNotEmpty, isString, IsString, Length, MaxLength, MinLength, minLength } from "class-validator";

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    code: string;

    @IsString()
    @Length(8, 50)
    newPassword: string;
}
