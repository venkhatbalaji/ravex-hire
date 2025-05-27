import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class AppService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: LoggerService,
  ) {}

  getHello(): string {
    this.logger.log('Executing getHello service method', AppService.name);
    this.logger.warn('This is a sample warning log.', AppService.name);
    this.logger.error('This is a sample error log.', AppService.name);
    return 'Hello World!';
  }
}
