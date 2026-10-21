import {
  AppButton,
  AppHeader,
  AppPinInput,
  AppText,
  AppView,
  toast,
} from "@components";
import React, { useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { createOtpSchema, DEFAULT_OTP_LENGTH } from "../data/schema";
import { useForm } from "@tanstack/react-form";
import { useAuthFlowStore } from "../store";
import { Redirect, router } from "expo-router";
import { useVerifyOtp } from "../query";
import { getDeviceInfo } from "@shared/utils/device";
import { useAuth } from "@shared/context/auth-context";
import { PhoneVerificationResponse } from "@shared/types/api";

export default function OtpScreen() {
  const { data } = useAuthFlowStore();

  // Opened without an active challenge (deep link, reload, back navigation after login).
  if (!data) return <Redirect href="/signin" />;

  return <OtpForm challenge={data} />;
}

function OtpForm({ challenge }: { challenge: PhoneVerificationResponse }) {
  const { stage, setStage } = useAuthFlowStore();
  const { setAuthState } = useAuth();
  const [otpData, setOtpData] = useState(challenge);
  const codeLength = otpData.codeLength || DEFAULT_OTP_LENGTH;
  const otpSchema = useMemo(() => createOtpSchema(codeLength), [codeLength]);

  const { verifyMutation, resendMutation } = useVerifyOtp();
  const { mutate: verifyOtp, isPending } = verifyMutation;
  const { mutate: resendOtp, isPending: isPendingResend } = resendMutation;

  const submit = async (value: { otp: string }) => {
    const deviceInfo = await getDeviceInfo();
    verifyOtp(
      {
        code: value.otp,
        challengeId: otpData.challengeId,
        device: deviceInfo,
      },
      {
        onSuccess: async (data) => {
          try {
            await setAuthState({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              user: data.user,
            });
          } catch {
            toast.show({
              type: "error",
              text1: "Error",
              text2: "Unable to save your sign-in on this device. Please try again.",
            });
            return;
          }

          if (data.user.profileComplete) {
            router.replace("/chats");
          } else {
            setStage("name");
            router.replace("/profile-name");
          }
        },
        onError: () => {
          toast.show({ type: "error", text1: "Error", text2: "Invalid OTP" });
        },
      },
    );
  };

  const [countdown, setCountdown] = useState(
    stage === "otp" ? otpData.resendInSeconds : 0,
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resend = () => {
    if (isPendingResend || countdown > 0) return;

    resendOtp(
      { challengeId: otpData.challengeId },
      {
        onSuccess: (data) => {
          setOtpData(data);
          setStage("otp", { data });
          setCountdown(data.resendInSeconds);
        },
        onError: () => {
          toast.show({
            type: "error",
            text1: "Error",
            text2: "Unable to resend the code. Please try again.",
          });
        },
      },
    );
  };

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
          Enter verification code
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
        <Field
          name="otp"
          children={(field) => <AppPinInput field={field} length={codeLength} />}
        />
        <View className="self-center flex-row items-center pt-8">
          <AppText color="subtext" variant="body-md-regular">
            If you don&apos;t get the code
          </AppText>
          {countdown === 0 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={resend}
              disabled={isPendingResend}
              accessibilityRole="button"
              accessibilityState={{ busy: isPendingResend, disabled: isPendingResend }}
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
                disabled={!canSubmit || values.otp.length !== codeLength || isPending}
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
