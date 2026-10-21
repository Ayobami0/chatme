import { apiClient } from "@core/network/api";
import {
  MatchContactsRequest,
  MatchContactsResponse,
  SearchContactsResponse,
} from "@shared/types/api";

export class DiscoveryService {
  static async matchContacts(
    request: MatchContactsRequest,
  ): Promise<MatchContactsResponse> {
    return (
      await apiClient.post<MatchContactsResponse>("/contacts/match", request)
    ).data;
  }

  static async searchUsers(
    q: string,
    params?: { limit?: number; cursor?: string },
  ): Promise<SearchContactsResponse> {
    return (
      await apiClient.get<SearchContactsResponse>("/users/search", {
        params: { q, ...params },
      })
    ).data;
  }
}
