import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@services/auth";

export function useSendPhoneVerification() {
  return useMutation({
    mutationFn: AuthService.requestOTP,
  });
}
