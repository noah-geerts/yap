type Message = {
  room: string;
  from: string;
  timestamp_utc: number;
  text: string;
};

export function isMessage(obj: any): obj is Message {
  return (
    obj &&
    typeof obj.room === "string" &&
    typeof obj.from === "string" &&
    typeof obj.timestamp_utc === "number" &&
    typeof obj.text === "string"
  );
}

export default Message;
