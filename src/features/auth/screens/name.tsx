import {
  AppButton,
  AppHeader,
  AppText,
  AppTextField,
  AppView,
  toast,
} from "@components";
import { View } from "react-native";
import { fullNameSchema, phoneNumberSchema } from "../data/schema";
import z from "zod";
import { useAuthFlowStore } from "../store";
import { useForm } from "@tanstack/react-form";
import { AuthService } from "@services/auth";
import { useMutation } from "@tanstack/react-query";
import { SolidUserSvg } from "@shared/components/svgs/icons";
import { router } from "expo-router";
import StorageService, { StorageKey } from "@services/storage";
import { log } from "@core/logging";

export default function ProfileNameScreen() {
  const submit = async (value: z.infer<typeof fullNameSchema>) => {
    mutate(
      { displayName: value.fullName },
      {
        onSuccess: async () => {
          log.info(await StorageService.secureGet(StorageKey.AuthToken));
          await StorageService.save(StorageKey.ProfileFlowStage, "image");
          router.push("/profile-image");
          setStage("image");
        },
        onError: () => {
          toast.show({
            type: "error",
            text1: "Error",
            text2: "Unable to update profile image",
          });
        },
      },
    );
  };
  const { setStage } = useAuthFlowStore();

  const { mutate, isPending } = useMutation({
    mutationFn: AuthService.updateProfile,
  });

  const { Field, handleSubmit, Subscribe } = useForm({
    onSubmit: ({ value }) => submit(value),
    defaultValues: { fullName: "" },
    validators: { onChange: fullNameSchema },
  });
  return (
    <AppView withSafeArea>
      <AppHeader onBack={router.canGoBack() ? router.back : undefined} />
      <View className="pt-6 flex-1">
        <AppText variant="h3" className="pb-3">
          What's your name?
        </AppText>
        <AppText color="subtext" variant="body-md-regular" className="pb-6">
          Write your name. You can change it back in settings.
        </AppText>
        <Field
          name="fullName"
          children={(field) => (
            <AppTextField
              label="Name"
              placeholder="Name"
              field={field}
              icon={({ isFocused }) => (
                <SolidUserSvg
                  className={`text-subtext ${isFocused ? "text-primary" : ""}`}
                />
              )}
            />
          )}
        />
        <View className="flex-1 justify-end w-full">
          <Subscribe
            children={({ canSubmit, values }) => (
              <AppButton
                className="w-full"
                isLoading={isPending}
                disabled={
                  !canSubmit || values.fullName.trim().length === 0 || isPending
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
