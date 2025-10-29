import SendMessageDto from './SendMessageDto';

export default class MessageStatusDto {
  // Identifies the message who's status we care about
  message: SendMessageDto;

  // Success/error info
  success: boolean;
  errorMessage?: string;
}
