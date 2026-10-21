import { useMutation, useQuery } from "@tanstack/react-query";
import { DiscoveryService } from "@services/discovery";

export function useMatchContacts() {
  return useMutation({
    mutationFn: (phoneNumbers: string[]) =>
      DiscoveryService.matchContacts({ phoneNumbers }),
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => DiscoveryService.searchUsers(query),
    enabled: false,
  });
}
