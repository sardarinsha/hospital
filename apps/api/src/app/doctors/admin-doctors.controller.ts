import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDoctorBodyDto } from './dto/create-doctor.dto';
import { UpdateDoctorBodyDto } from './dto/update-doctor.dto';
import { DoctorsService } from './doctors.service';

@Controller('admin/doctors')
@Roles(Role.ADMIN)
export class AdminDoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  list() {
    return this.doctorsService.findAllForAdmin();
  }

  @Post()
  create(@Body() body: CreateDoctorBodyDto) {
    return this.doctorsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateDoctorBodyDto,
  ) {
    return this.doctorsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.doctorsService.remove(id);
  }
}
