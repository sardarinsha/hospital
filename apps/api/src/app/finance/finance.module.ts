import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientFeeLineEntity } from '../patient-fees/patient-fee-line.entity';
import { UserEntity } from '../users/user.entity';
import { FinanceLedgerController } from './finance-ledger.controller';
import { OfficeLedgerEntryEntity } from './office-ledger-entry.entity';
import { OfficeLedgerService } from './office-ledger.service';
import { ProfitLossService } from './profit-loss.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OfficeLedgerEntryEntity,
      UserEntity,
      PatientFeeLineEntity,
    ]),
  ],
  controllers: [FinanceLedgerController],
  providers: [OfficeLedgerService, ProfitLossService],
})
export class FinanceModule {}
