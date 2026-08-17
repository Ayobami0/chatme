import {
  AppButton,
  AppHeader,
  AppPinInput,
  AppText,
  AppView,
  toast,
} from "@components";
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { otpSchema } from "../data/schema";
import z from "zod";
import { useForm } from "@tanstack/react-form";
import { useAuthFlowStore } from "../store";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@services/auth";
import { getDeviceInfo } from "@shared/utils/device";
import { useSessionStore } from "@shared/store/session";

export default function OtpScreen() {
  const { data, stage, setStage } = useAuthFlowStore();
  const setAuthState = useSessionStore((s) => s.setAuthState);
  const [otpData, setOtpData] = useState(data!);

  const submit = async (value: z.infer<typeof otpSchema>) => {
    const deviceInfo = await getDeviceInfo();
    verifyOtp(
      {
        code: value.otp,
        challengeId: otpData.challengeId,
        device: deviceInfo,
      },
      {
        onSuccess: async (data) => {
          setAuthState({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            user: data.user,
          });
          router.push("/profile-name");
          setStage("name");
        },
        onError: () => {
          toast.show({ type: "error", text1: "Error", text2: "Invalid OTP" });
        },
      },
    );
  };

  const resend = () =>
    resendOtp(
      { challengeId: otpData.challengeId },
      {
        onSuccess: (data) => {
          setOtpData(data);
          setCountdown(data.resendInSeconds);
        },
      },
    );


  const [countdown, setCountdown] = React.useState(
    stage === "otp" ? otpData.resendInSeconds : 0,
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const { mutate: verifyOtp, isPending } = useMutation({
    mutationFn: AuthService.verifyOTP,
  });
  const { mutate: resendOtp, isPending: isPendingResend } = useMutation({
    mutationFn: AuthService.resendOTP,
  });

  const { Field, handleSubmit, Subscribe } = useForm({
    onSubmit: ({ value }) => submit(value),
    defaultValues: { otp: "" },
    validators: { onChange: otpSchema },
  });

  return (
    <AppView withSafeArea>
      <AppHeader onBack={router.back} />
      <View className="flex flex-col flex-1 items-start pt-6">
        <AppText variant="h3" className="pb-3">
          What's your phone number?
        </AppText>
        <AppText color="subtext" variant="body-md-regular" className="pb-8">
          Enter the code number we sent to{" "}
          {
            <AppText variant="body-md-medium">
              {otpData.phoneNumberMasked}
            </AppText>
          }
          .
        </AppText>
        <Field name="otp" children={(field) => <AppPinInput field={field} />} />
        <View className="self-center flex-row items-center pt-8">
          <AppText color="subtext" variant="body-md-regular">
            If you don't get the code
          </AppText>
          {countdown === 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => resend()}
            >
              <AppText
                color={isPendingResend ? "subtext" : "primary"}
                variant="body-md-medium"
              >
                {" "}Resend code
              </AppText>
            </TouchableOpacity>
          ) : (
            <AppText variant="body-md-regular" color="subtext">
              , resend it in{" "}
              <AppText variant="body-md-medium">{countdown}</AppText> seconds.
            </AppText>
          )}
        </View>
        <View className="flex-1 justify-end w-full">
          <Subscribe
            children={({ canSubmit, values }) => (
              <AppButton
                className="w-full"
                isLoading={isPending}
                disabled={!canSubmit || values.otp.length !== 4 || isPending}
                onPress={handleSubmit}
              >
                Next
              </AppButton>
            )}
          />
        </View>
      </View>
    </AppView>
  );
}
