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

// If replies are included
export interface RepliedMessage {
  id: number;
  content: string;
  user: Pick<User, "id" | "username" | "avatar">;
}

// Shared Data between message & edit
export interface BaseMessageData {
  id: number;
  content: string;
  files: string[];            // or a more specific file type
  topic: Topic;
  user: User;
  createdAt: string;          // ISO timestamp
  updatedAt: string | null;   // ISO timestamp or null
  first: boolean;
  repliedMessageId: number | null;
  repliedMessage?: RepliedMessage;
  poll?: unknown;             // adapt if you support polls
}
