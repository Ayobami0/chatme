import { apiClient } from "@core/network/api";
import {
  MatchContactsRequest,
  MatchContactsResponse,
  PaginatedResponse,
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

  static async searchUsers(q: string): Promise<SearchContactsResponse> {
    return (
      await apiClient.get<SearchContactsResponse>("/users/search", {
        params: { q },
      })
    ).data;
  }
}
