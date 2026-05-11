import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateDoctorBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  medicalField?: string;
}
