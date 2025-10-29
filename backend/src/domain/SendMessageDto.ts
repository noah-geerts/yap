import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export default class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  toId: string;

  @IsInt()
  timestamp_utc: number;

  @IsString()
  @IsNotEmpty()
  text: string;
}
