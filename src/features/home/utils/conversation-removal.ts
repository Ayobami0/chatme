import { ConversationModel } from "@shared/types/models";

/**
 * The destructive action that applies to a conversation for the current user.
 * - remove-for-me: direct chat, hidden from the current user's list only.
 * - delete-group: group the current user owns, deleted for every member.
 * - leave-group: group the current user is a non-owner member of.
 */
export type RemovalAction = "remove-for-me" | "delete-group" | "leave-group";

export function getRemovalAction(conversation: ConversationModel): RemovalAction {
  if (conversation.type === "direct") return "remove-for-me";
  return conversation.role === "owner" ? "delete-group" : "leave-group";
}

export const REMOVAL_COPY: Record<
  RemovalAction,
  { label: string; title: string; message: string }
> = {
  "remove-for-me": {
    label: "Remove chat",
    title: "Remove chat?",
    message:
      "This chat will be removed from your list. The other person will still see it.",
  },
  "delete-group": {
    label: "Delete group",
    title: "Delete group for everyone?",
    message:
      "This permanently deletes the group and its messages for all members.",
  },
  "leave-group": {
    label: "Leave group",
    title: "Leave group?",
    message: "You will stop receiving messages from this group.",
  },
};

/** Builds confirmation copy for one or more conversations, which may need different actions. */
export function describeRemoval(conversations: ConversationModel[]) {
  if (conversations.length === 1) {
    return REMOVAL_COPY[getRemovalAction(conversations[0])];
  }

  const counts = { "remove-for-me": 0, "delete-group": 0, "leave-group": 0 };
  conversations.forEach((c) => counts[getRemovalAction(c)]++);

  const parts = [
    counts["remove-for-me"] && `remove ${counts["remove-for-me"]} chat(s) from your list`,
    counts["leave-group"] && `leave ${counts["leave-group"]} group(s)`,
    counts["delete-group"] &&
      `delete ${counts["delete-group"]} group(s) you own for every member`,
  ].filter(Boolean);

  return {
    label: "Remove",
    title: `Remove ${conversations.length} chats?`,
    message: `This will ${parts.join(", ")}.`,
  };
}
