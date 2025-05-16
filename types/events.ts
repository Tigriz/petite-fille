import type { BaseMessageData } from "./shared";

export interface MessageEvent {
  type: "message";
  data: BaseMessageData;
}

// "edit" event is identical shape (just a different type)
export interface EditEvent {
  type: "updatemessage";
  data: BaseMessageData;
}

// Optionally, if you want to distinguish edits further:
export interface EditedMessageData extends BaseMessageData {
  editedAt: string;          // if the payload includes an edit timestamp
}

export interface EditEventVerbose {
  type: "updatemessage";
  data: EditedMessageData;
}

// src/types.ts (continued)

// Include other event types if you process them
export type TypingEvent = {
  type: "typing";
  data: {
    count: number;
    topic: number;
    username: string;
  };
};

export type WsEvent = MessageEvent | EditEvent | TypingEvent;

// A runtime check that msg.type is "message" or "edit"
export function isMessageOrEdit(
  msg: WsEvent
): msg is MessageEvent | EditEvent {
  return msg.type === "message" || msg.type === "updatemessage";
}
