import { Module } from '@nestjs/common';

import { TransfersController } from './controllers/transfers.controller';
import { TransfersRepository } from './repositories/transfers.repository';
import { TransfersService } from './services/transfers.service';

@Module({
  controllers: [TransfersController],
  providers: [TransfersService, TransfersRepository],
})
export class TransfersModule {}
