import { OfficeLedgerKind } from '@hospital/shared';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateOfficeLedgerEntryBodyDto {
  @IsEnum(OfficeLedgerKind)
  kind!: OfficeLedgerKind;

  @Min(0.01)
  amount!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  description!: string;

  @IsDateString()
  entryDate!: string;

  @ValidateIf((o) => o.kind === OfficeLedgerKind.SALARY)
  @IsUUID()
  payeeUserId?: string;
}
