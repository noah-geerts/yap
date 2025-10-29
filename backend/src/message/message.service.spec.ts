import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { DynamodbModule } from '../dynamodb/dynamodb.module';
import { getChatId } from './message.service';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageService],
      imports: [DynamodbModule],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  it('getChatId should return smaller string concatenated with bigger string', () => {
    // Arrange
    const a = 'a';
    const b = 'b';
    const expected = 'a:b';

    // Act & Assert (a then b for parameters)
    let result = getChatId(a, b);
    expect(result).toEqual(expected);

    // Act & Assert (b then a for parameters)
    result = getChatId(b, a);
    expect(result).toEqual(expected);
  });

  it('getChatId should return smaller string concatenated with bigger string in alpabetical order', () => {
    // Arrange
    const a = 'az';
    const b = 'axx';
    const expected = 'axx:az';

    // Act & Assert (a then b for parameters)
    let result = getChatId(a, b);
    expect(result).toEqual(expected);

    // Act & Assert (b then a for parameters)
    result = getChatId(b, a);
    expect(result).toEqual(expected);
  });
});
