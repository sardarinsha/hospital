import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Request } from 'express';
import { RequestUser } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { PatientsService } from '../patients/patients.service';
import { CreatePatientFeeLineDto } from './dto/create-patient-fee-line.dto';
import { UpdatePatientFeeLineDto } from './dto/update-patient-fee-line.dto';
import { PatientFeesService } from './patient-fees.service';

@Controller('patients/:patientId/fees')
export class PatientFeesController {
  constructor(
    private readonly patientFeesService: PatientFeesService,
    private readonly patientsService: PatientsService,
  ) {}

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Get()
  async list(
    @Req() req: Request & { user: RequestUser },
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
  ) {
    await this.patientsService.assertCanAccessPatient(
      patientId,
      req.user.role,
      req.user.id,
    );
    return this.patientFeesService.listForPatient(patientId);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Post()
  async add(
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Body() dto: CreatePatientFeeLineDto,
    @Req() req: Request & { user: RequestUser },
  ) {
    await this.patientsService.assertCanAccessPatient(
      patientId,
      req.user.role,
      req.user.id,
    );
    return this.patientFeesService.addLine(patientId, dto, req.user.id);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Post(':lineId/payment')
  async recordPayment(
    @Req() req: Request & { user: RequestUser },
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('lineId', new ParseUUIDPipe()) lineId: string,
  ) {
    await this.patientsService.assertCanAccessPatient(
      patientId,
      req.user.role,
      req.user.id,
    );
    return this.patientFeesService.setLinePaid(
      patientId,
      lineId,
      true,
      req.user.id,
    );
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Delete(':lineId/payment')
  async voidPayment(
    @Req() req: Request & { user: RequestUser },
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('lineId', new ParseUUIDPipe()) lineId: string,
  ) {
    await this.patientsService.assertCanAccessPatient(
      patientId,
      req.user.role,
      req.user.id,
    );
    return this.patientFeesService.setLinePaid(
      patientId,
      lineId,
      false,
      req.user.id,
    );
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Patch(':lineId')
  async update(
    @Req() req: Request & { user: RequestUser },
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('lineId', new ParseUUIDPipe()) lineId: string,
    @Body() dto: UpdatePatientFeeLineDto,
  ) {
    await this.patientsService.assertCanAccessPatient(
      patientId,
      req.user.role,
      req.user.id,
    );
    return this.patientFeesService.updateLine(patientId, lineId, dto);
  }

  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @Delete(':lineId')
  async remove(
    @Req() req: Request & { user: RequestUser },
    @Param('patientId', new ParseUUIDPipe()) patientId: string,
    @Param('lineId', new ParseUUIDPipe()) lineId: string,
  ) {
    await this.patientsService.assertCanAccessPatient(
      patientId,
      req.user.role,
      req.user.id,
    );
    return this.patientFeesService.removeLine(patientId, lineId);
  }
}
