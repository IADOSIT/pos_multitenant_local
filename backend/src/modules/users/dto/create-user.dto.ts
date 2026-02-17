import { IsEmail, IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../user.entity';

class NuevoTenantDto {
  @IsNotEmpty() @IsString() nombre: string;
  @IsOptional() @IsString() razon_social?: string;
  @IsOptional() @IsString() rfc?: string;
}

class NuevaEmpresaDto {
  @IsNotEmpty() @IsString() nombre: string;
  @IsOptional() @IsString() razon_social?: string;
}

class NuevaTiendaDto {
  @IsNotEmpty() @IsString() nombre: string;
  @IsOptional() @IsString() direccion?: string;
}

export class CreateUserWizardDto {
  @IsNotEmpty() @IsString() nombre: string;
  @IsEmail() email: string;
  @IsNotEmpty() @MinLength(6) password: string;
  @IsOptional() @IsEnum(UserRole) rol?: UserRole;
  @IsOptional() @IsString() pin?: string;

  @IsOptional() @IsNumber() tenant_id?: number;
  @IsOptional() @IsNumber() empresa_id?: number;
  @IsOptional() @IsNumber() tienda_id?: number;

  @IsOptional() @ValidateNested() @Type(() => NuevoTenantDto) nuevo_tenant?: NuevoTenantDto;
  @IsOptional() @ValidateNested() @Type(() => NuevaEmpresaDto) nueva_empresa?: NuevaEmpresaDto;
  @IsOptional() @ValidateNested() @Type(() => NuevaTiendaDto) nueva_tienda?: NuevaTiendaDto;
}
