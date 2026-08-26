import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';

import type { AuthenticatedUser, Beneficiary } from '@banking/contracts';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CreateBeneficiaryDto, UpdateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { BeneficiariesService } from '../services/beneficiaries.service';

@Controller('beneficiaries')
export class BeneficiariesController {
  constructor(private readonly beneficiaries: BeneficiariesService) {}

  // Reading the payee list is part of viewing an account; changing it is a
  // separate, higher-privilege capability — hence two different permissions.
  @Get()
  @RequirePermissions('VIEW_ACCOUNT')
  list(@CurrentUser() user: AuthenticatedUser): Promise<Beneficiary[]> {
    return this.beneficiaries.list(user.id);
  }

  @Get(':id')
  @RequirePermissions('VIEW_ACCOUNT')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<Beneficiary> {
    return this.beneficiaries.getById(user.id, id);
  }

  @Post()
  @RequirePermissions('MANAGE_BENEFICIARY')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateBeneficiaryDto,
  ): Promise<Beneficiary> {
    return this.beneficiaries.create(user.id, body);
  }

  @Patch(':id')
  @RequirePermissions('MANAGE_BENEFICIARY')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateBeneficiaryDto,
  ): Promise<Beneficiary> {
    return this.beneficiaries.update(user.id, id, body);
  }

  @Delete(':id')
  @RequirePermissions('MANAGE_BENEFICIARY')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.beneficiaries.remove(user.id, id);
  }
}
