import {
  IsEnum,
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  Length,
  IsBoolean
} from 'class-validator';
import { DocumentType } from '../enums/document-type.enum';
import { Gender } from '../enums/gender.enum';

export class PartialUpdateUserDto {

  @IsOptional()
  @IsEnum(DocumentType, { message: 'El tipo de documento debe ser uno de los siguientes valores: RC, TI, CC, TE, CE, NIT, PP, PEP, DIE, NUIP, FOREIGN_NIT' })
  documentType?: DocumentType;

  @IsOptional()
  @IsString({ message: 'El ID del documento debe ser una cadena de texto' })
  @Length(1, 20, { message: 'El ID del documento debe tener entre 1 y 20 caracteres' })
  documentId?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Length(1, 50, { message: 'El nombre debe tener entre 1 y 50 caracteres' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @Length(1, 50, { message: 'El apellido debe tener entre 1 y 50 caracteres' })
  lastName?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'El género debe ser uno de los siguientes: male, female, o other' })
  gender?: Gender;

  @IsOptional()
  @IsString({ message: 'El número de teléfono debe ser una cadena de texto' })
  @Length(1, 15, { message: 'El número de teléfono debe tener entre 1 y 15 caracteres' })
  phoneNumber?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico debe ser una dirección de correo válida' })
  @Length(1, 100, { message: 'El correo electrónico debe tener entre 1 y 100 caracteres' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @Length(1, 255, { message: 'La dirección debe tener entre 1 y 255 caracteres' })
  address?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida en formato ISO 8601' })
  birthDate?: string;

  // Agrega otros campos opcionales según tus necesidades
  @IsOptional()
  @IsString({ message: 'El token de refresco debe ser una cadena de texto' })
  refreshToken?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado de actividad debe ser un valor booleano' })
  isActive?: boolean;
}
