import { Test, TestingModule } from '@nestjs/testing';
import { IncubatorsService } from './incubators.service';

describe('IncubatorsService', () => {
  let service: IncubatorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncubatorsService],
    }).compile();

    service = module.get<IncubatorsService>(IncubatorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
