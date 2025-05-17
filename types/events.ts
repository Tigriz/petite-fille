import type { BaseMessageData } from "./shared";

export interface MessageEvent {
  type: "message";
  data: BaseMessageData;
}

export interface EditEvent {
  type: "updatemessage";
  data: BaseMessageData;
}

export interface EditedMessageData extends BaseMessageData {
  editedAt: string;
}

export interface EditEventVerbose {
  type: "updatemessage";
  data: EditedMessageData;
}

export type TypingEvent = {
  type: "typing";
  data: {
    count: number;
    topic: number;
    username: string;
  };
};

export type WsEvent = MessageEvent | EditEvent | TypingEvent;

export function isMessageOrEdit(msg: WsEvent): msg is MessageEvent | EditEvent {
  return msg.type === "message" || msg.type === "updatemessage";
}
