import {
  ConversationModel,
  DirectConversationModel,
  GroupConversationModel,
  GroupMemberRole,
} from "@shared/types/models";
import { describeRemoval, getRemovalAction } from "../conversation-removal";

const base = {
  latestMessage: null,
  unreadCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  settings: {} as ConversationModel["settings"],
};

const direct = (id = "d1"): DirectConversationModel => ({
  ...base,
  id,
  type: "direct",
  otherParticipant: { id: "u2", displayName: "Bo", avatarUrl: null },
});

const group = (role: GroupMemberRole, id = "g1"): GroupConversationModel => ({
  ...base,
  id,
  type: "group",
  name: "Team",
  avatarUrl: null,
  participants: [],
  role,
});

describe("getRemovalAction", () => {
  it("removes direct chats for the current user only", () => {
    expect(getRemovalAction(direct())).toBe("remove-for-me");
  });

  it("deletes groups the user owns", () => {
    expect(getRemovalAction(group("owner"))).toBe("delete-group");
  });

  it.each<GroupMemberRole>(["admin", "member"])("leaves groups as %s", (role) => {
    expect(getRemovalAction(group(role))).toBe("leave-group");
  });
});

describe("describeRemoval", () => {
  it("warns that an owned group is deleted for everyone", () => {
    expect(describeRemoval([group("owner")]).title).toMatch(/for everyone/);
  });

  it("summarises each action in a mixed selection", () => {
    const { message } = describeRemoval([
      direct("d1"),
      direct("d2"),
      group("owner", "g1"),
      group("member", "g2"),
    ]);
    expect(message).toContain("remove 2 chat(s) from your list");
    expect(message).toContain("leave 1 group(s)");
    expect(message).toContain("delete 1 group(s) you own for every member");
  });
});
