import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          } as LoggerService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
