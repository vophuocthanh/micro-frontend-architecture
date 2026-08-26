import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import type { AuthenticatedUser, Paginated, Transfer, TransferQuote } from '@banking/contracts';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { TRANSFER_THROTTLE } from '../../common/throttling/throttle.config';
import { CreateTransferDto, TransferQueryDto, TransferQuoteDto } from '../dto/create-transfer.dto';
import { TransfersService } from '../services/transfers.service';

@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Get()
  @RequirePermissions('VIEW_TRANSACTION')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TransferQueryDto,
  ): Promise<Paginated<Transfer>> {
    return this.transfers.list(user.id, query);
  }

  @Post('quote')
  @RequirePermissions('TRANSFER_MONEY')
  @HttpCode(HttpStatus.OK)
  quote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: TransferQuoteDto,
  ): Promise<TransferQuote> {
    return this.transfers.quote(user.id, body);
  }

  /**
   * The permission is checked here, on the server, for every caller.
   *
   * The Angular remote also hides its own transfer form without it — that is a
   * courtesy to the user. This line is the control: a hand-crafted request from
   * a browser console gets a 403 regardless of what the UI displayed.
   */
  @Post()
  @RequirePermissions('TRANSFER_MONEY')
  @Throttle({ default: TRANSFER_THROTTLE })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateTransferDto,
  ): Promise<Transfer> {
    return this.transfers.create(user.id, body);
  }

  @Get(':id')
  @RequirePermissions('VIEW_TRANSACTION')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<Transfer> {
    return this.transfers.getById(user.id, id);
  }
}
