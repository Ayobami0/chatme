import {
  AppText,
  AppView,
  AppButton,
  AppPhoneTextField,
  toast,
} from "@shared/components";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { View } from "react-native";
import { AuthService } from "@services/auth";
import { phoneNumberSchema } from "../data/schema";
import z from "zod";
import { useState } from "react";
import { router } from "expo-router";
import { useAuthFlowStore } from "../store";
import StorageService, { StorageKey } from "@services/storage";

export default function SignInScreen() {
  const { setStage } = useAuthFlowStore();

  const { isPending, mutate } = useMutation({
    mutationFn: AuthService.requestOTP,
    onSuccess: async (data) => {
      setStage("otp", { data });
      router.push("/opt");
    },
    onError: () => {
      toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to send OTP",
      });
    },
  });

  const submit = (value: z.infer<typeof phoneNumberSchema>) => {
    mutate({ phoneNumber: `+${code.countryCallCode}${value.phoneNumber}` });
  };

  const { Field, handleSubmit, Subscribe } = useForm({
    onSubmit: ({ value }) => submit(value),
    defaultValues: { phoneNumber: "" },
    validators: { onChange: phoneNumberSchema },
  });

  const [code, setCode] = useState({
    countryCode: "NG",
    countryCallCode: "234",
  });

  return (
    <AppView withSafeArea className="p-0">
      <View className="flex flex-col h-full items-start px-6 pt-16">
        <AppText variant="h3" className="pb-3">
          What's your phone number?
        </AppText>
        <AppText color="subtext" variant="body-md-regular" className="pb-6">
          We will send you the verification code.
        </AppText>
        <Field name="phoneNumber">
          {(field) => (
            <AppPhoneTextField
              label="Phone Number"
              onCodeSelect={(code) => setCode(code)}
              placeholder="Phone Number"
              defaultCode={code}
              field={field}
            />
          )}
        </Field>
        <View className="flex-1 justify-end w-full">
          <Subscribe
            children={({ canSubmit, values }) => (
              <AppButton
                className="w-full"
                isLoading={isPending}
                disabled={
                  isPending || !canSubmit || values.phoneNumber.length === 0
                }
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
