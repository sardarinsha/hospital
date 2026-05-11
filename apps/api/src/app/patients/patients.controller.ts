import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../auth/jwt.strategy';
import { CreatePatientBodyDto } from './dto/create-patient.dto';
import { UpdatePatientBodyDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';
import { DoctorsService } from '../doctors/doctors.service';

@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly doctorsService: DoctorsService,
  ) {}

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Get('doctor-options')
  doctorOptions() {
    return this.doctorsService.findRegistrationOptions();
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Post()
  create(
    @Req() req: Request & { user: RequestUser },
    @Body() body: CreatePatientBodyDto,
  ) {
    return this.patientsService.create(body, req.user.id);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.LAB_TECH, Role.DOCTOR)
  @Get()
  findAll(
    @Req() req: Request & { user: RequestUser },
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const registeredByUserId =
      req.user.role === Role.RECEPTIONIST ? req.user.id : undefined;
    return this.patientsService.findAll({
      search,
      page: safePage,
      limit: safeLimit,
      registeredByUserId,
    });
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.LAB_TECH, Role.DOCTOR)
  @Get(':id')
  async findOne(
    @Req() req: Request & { user: RequestUser },
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    await this.patientsService.assertCanAccessPatient(
      id,
      req.user.role,
      req.user.id,
    );
    return this.patientsService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Patch(':id')
  update(
    @Req() req: Request & { user: RequestUser },
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdatePatientBodyDto,
  ) {
    return this.patientsService.update(id, body, {
      role: req.user.role,
      userId: req.user.id,
    });
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.patientsService.remove(id);
  }
}
