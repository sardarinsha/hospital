import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Role } from '@hospital/shared';
import { Request } from 'express';
import { RequestUser } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateOfficeLedgerEntryBodyDto } from './dto/create-office-ledger-entry.dto';
import { OfficeLedgerService } from './office-ledger.service';
import { ProfitLossService } from './profit-loss.service';

@Controller('finance')
@Roles(Role.ADMIN, Role.RECEPTIONIST)
export class FinanceLedgerController {
  constructor(
    private readonly officeLedger: OfficeLedgerService,
    private readonly profitLossService: ProfitLossService,
  ) {}

  @Get('profit-loss')
  getProfitLossReport(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.profitLossService.report(from, to);
  }

  @Get('ledger')
  list(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 200;
    return this.officeLedger.listRecent(Number.isFinite(n) ? n : 200);
  }

  @Post('ledger')
  create(
    @Req() req: Request & { user: RequestUser },
    @Body() body: CreateOfficeLedgerEntryBodyDto,
  ) {
    return this.officeLedger.create(body, req.user.id);
  }

  @Get('staff-payees')
  staffPayees() {
    return this.officeLedger.staffPayeeOptions();
  }
}
