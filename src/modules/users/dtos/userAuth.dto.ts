import { 
    IsString, 
    IsNotEmpty 
} from 'class-validator';

export class UserAuthDto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
