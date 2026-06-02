import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ApiBearerJwt } from '../common/swagger/api-bearer-jwt.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProjectAccessGuard } from '../common/guards/project-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ScheduleImportsService } from './schedule-imports.service';
import { ScheduleImportOptionsDto } from './dto/schedule-import-options.dto';
import { ScheduleImportPreviewResponseDto } from './dto/schedule-import-preview-response.dto';
import { ScheduleImportResultDto } from './dto/schedule-import-result.dto';
import { assertScheduleImportFile } from './utils/schedule-import-file.util';
import { SCHEDULE_IMPORT_MAX_FILE_BYTES } from './schedule-import.constants';

@ApiTags('Schedule imports')
@ApiBearerJwt()
@Controller('projects/:projectId/schedule-imports')
@UseGuards(JwtAuthGuard, ProjectAccessGuard, RolesGuard)
@Roles(UserRole.ULTIMO_PLANIFICADOR)
export class ScheduleImportsController {
  constructor(private readonly scheduleImportsService: ScheduleImportsService) {}

  @Post('preview')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: SCHEDULE_IMPORT_MAX_FILE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: ScheduleImportPreviewResponseDto })
  preview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.scheduleImportsService.preview(
      user,
      new Types.ObjectId(projectId),
      assertScheduleImportFile(file),
    );
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: SCHEDULE_IMPORT_MAX_FILE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        createMissingSectors: { type: 'boolean', default: true },
        createMissingWorkPackages: { type: 'boolean', default: true },
        scheduleUploadId: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({ type: ScheduleImportResultDto })
  importSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() options: ScheduleImportOptionsDto,
  ) {
    return this.scheduleImportsService.import(
      user,
      new Types.ObjectId(projectId),
      assertScheduleImportFile(file),
      options,
    );
  }
}
