import { Controller, Post, Body, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, LoginPinDto, VerifyPinDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('login-pin')
  loginPin(@Body() dto: LoginPinDto) {
    return this.authService.loginPin(dto.pin, dto.tienda_id, dto.user_id);
  }

  // Público: lista de usuarios activos de una tienda (solo id, nombre, rol)
  @Get('tienda-users')
  getUsersByTienda(@Query('tienda_id') tienda_id: string) {
    return this.authService.getUsersByTienda(Number(tienda_id));
  }

  // Protegido: verifica PIN para autorizar acciones críticas (no genera token)
  @UseGuards(AuthGuard('jwt'))
  @Post('verify-pin')
  verifyPin(@Body() dto: VerifyPinDto) {
    return this.authService.verifyPin(dto.pin, dto.tienda_id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req) {
    const { password, ...user } = req.user;
    return user;
  }
}
