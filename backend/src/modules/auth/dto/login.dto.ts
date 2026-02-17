import { IsEmail, IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginPinDto {
  @IsNotEmpty()
  @IsString()
  pin: string;

  @IsNumber()
  tienda_id: number;
}
