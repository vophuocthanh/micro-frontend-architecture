import { Module } from '@nestjs/common';

import { BeneficiariesController } from './controllers/beneficiaries.controller';
import { BeneficiariesRepository } from './repositories/beneficiaries.repository';
import { BeneficiariesService } from './services/beneficiaries.service';

@Module({
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService, BeneficiariesRepository],
  exports: [BeneficiariesRepository],
})
export class BeneficiariesModule {}
