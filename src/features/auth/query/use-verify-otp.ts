import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@services/auth";

export function useVerifyOtp() {
  const verifyMutation = useMutation({
    mutationFn: AuthService.verifyOTP,
  });

  const resendMutation = useMutation({
    mutationFn: AuthService.resendOTP,
  });

  return {
    verifyMutation,
    resendMutation,
  };
}
