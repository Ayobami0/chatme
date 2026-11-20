jest.mock("@core/network/api", () => ({
  apiClient: { delete: jest.fn(), post: jest.fn() },
}));

import { apiClient } from "@core/network/api";
import { ConversationService } from "@services/conversation";

describe("ConversationService removal endpoints", () => {
  beforeEach(() => jest.clearAllMocks());

  it("removes a direct chat via /for-me so the other participant is unaffected", async () => {
    await ConversationService.removeDirectConversationForMe("d1");
    expect(apiClient.delete).toHaveBeenCalledWith("/conversations/d1/for-me");
  });

  it("deletes a group via the owner-only endpoint", async () => {
    await ConversationService.deleteGroup("g1");
    expect(apiClient.delete).toHaveBeenCalledWith("/conversations/g1");
  });

  it("leaves a group without deleting it", async () => {
    await ConversationService.leaveGroup("g1");
    expect(apiClient.post).toHaveBeenCalledWith("/conversations/g1/leave");
    expect(apiClient.delete).not.toHaveBeenCalled();
  });
});
