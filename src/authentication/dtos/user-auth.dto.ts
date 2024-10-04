import { IsString, IsNotEmpty } from 'class-validator';

export class UserAuthDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  role: string;

  @IsNotEmpty()
  permissions: string[];

  @IsNotEmpty()
  isActive: boolean;
}
