import { apiClient } from "@core/network/api";
import { MatchContactsRequest, MatchContactsResponse } from "@shared/types/api";

export class DiscoveryService {
  static async matchContacts(request: MatchContactsRequest): Promise<MatchContactsResponse> {
    return (await apiClient.post<MatchContactsResponse>("/contacts/match", request)).data;
  }
}
