import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@services/auth";

export function useUpdateProfile() {
  return useMutation({
    mutationFn: AuthService.updateProfile,
  });
}
