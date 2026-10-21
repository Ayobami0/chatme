import { create } from "zustand";
import { combine } from "zustand/middleware";
import { PhoneVerificationResponse } from "@shared/types/api";

type AuthStage = "phone" | "otp" | "name" | "image" | "profile";

export const useAuthFlowStore = create(
  combine(
    {
      stage: "phone" as AuthStage,
      data: undefined as PhoneVerificationResponse | undefined,
      authToken: undefined as string | undefined,
    },
    (set, get) => ({
      setStage: (
        stage: AuthStage,
        opts?: {
          data?: PhoneVerificationResponse | undefined;
        },
      ) =>
        set({
          stage,
          data: opts?.data ?? get().data,
        }),
    }),
  ),
);
