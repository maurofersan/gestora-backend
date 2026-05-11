import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SetupService } from './setup.service';
import { BootstrapDto } from './dto/bootstrap.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  /** Ejecutar una sola vez cuando la BD está vacía. */
  @Public()
  @Post('bootstrap')
  @ApiOperation({ summary: 'Inicializar empresa + admin (solo BD vacía)', security: [] })
  bootstrap(@Body() dto: BootstrapDto) {
    return this.setupService.bootstrap(dto);
  }
}
