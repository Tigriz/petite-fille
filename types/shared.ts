export interface User {
  id: string;
  username: string;
  avatar: string;
  villages_members: Array<{
    points: number;
    kickedUntil: string | null;
  }>;
  groups_members: Array<{
    group: {
      id: number;
      name: string;
      icon: string;
    };
  }>;
}

export interface Topic {
  id: number;
  slug: string;
}

export interface RepliedMessage {
  id: number;
  content: string;
  user: Pick<User, "id" | "username" | "avatar">;
}

export interface BaseMessageData {
  id: number;
  content: string;
  files: string[];
  topic: Topic;
  user: User;
  createdAt: string;
  updatedAt: string | null;
  first: boolean;
  repliedMessageId: number | null;
  repliedMessage?: RepliedMessage;
  poll?: unknown;
}
