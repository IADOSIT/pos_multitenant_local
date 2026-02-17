import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrintService } from './print.service';

@Controller('print')
@UseGuards(AuthGuard('jwt'))
export class PrintController {
  constructor(private service: PrintService) {}

  @Post()
  print(@Body() data: { content: string; config?: any }) {
    return this.service.print(data.content, data.config);
  }

  @Get('queue')
  getQueue() {
    return this.service.getQueue();
  }

  @Get('job/:id')
  getJob(@Param('id') id: string) {
    return this.service.getJob(id);
  }
}
