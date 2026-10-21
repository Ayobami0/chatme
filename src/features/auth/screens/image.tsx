import { AppButton, AppHeader, AppText, AppView } from "@components";
import { router } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import * as Crypto from "expo-crypto";
import { useUpload } from "@shared/hooks/use-upload";
import { AuthService } from "@services/auth";
import { useAuth } from "@shared/context/auth-context";
import { log } from "@core/logging";
import { PickedImage } from "@shared/utils/media-file";
import {
  ImageIllustration,
  ImageIllustrationState,
} from "../components/image-upload";
import ImagePickerModal from "../components/image-picker-modal";

/**
 * idle → uploading → attached, or → failed (retryable). A local preview is never
 * treated as success: "attached" means the server has set it as the avatar.
 */
type AvatarState =
  | { status: "idle" }
  | { status: "uploading"; image: PickedImage; clientUploadId: string }
  | { status: "failed"; image: PickedImage; clientUploadId: string }
  | { status: "attached"; avatarUrl: string };

export default function ProfileImageScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [state, setState] = useState<AvatarState>({ status: "idle" });
  const { setUser } = useAuth();
  const { upload } = useUpload("profile_avatar");

  const attach = async (image: PickedImage, clientUploadId: string) => {
    setState({ status: "uploading", image, clientUploadId });
    try {
      const media = await upload({ ...image, clientUploadId });
      // A completed upload is only a media asset; it must be assigned to become the avatar.
      const user = await AuthService.setProfileAvatar({ mediaId: media.id });
      setUser(user);
      setState({ status: "attached", avatarUrl: user.avatarUrl ?? media.secureUrl ?? image.uri });
    } catch (err) {
      log.warn("Failed to set profile photo", (err as Error)?.message);
      setState({ status: "failed", image, clientUploadId });
    }
  };

  const illustration: ImageIllustrationState =
    state.status === "uploading"
      ? "uploading"
      : state.status === "attached"
        ? "uploaded"
        : "idle";

  const message =
    state.status === "uploading"
      ? "Wait a second, your photo is still uploading"
      : state.status === "attached"
        ? "Done! Your photo was uploaded"
        : state.status === "failed"
          ? "Your photo couldn't be uploaded. Please try again."
          : undefined;

  return (
    <AppView withSafeArea>
      <AppHeader onBack={router.canGoBack() ? router.back : undefined} />
      <View className="pt-6 flex-1">
        <AppText variant="h3" className="pb-3 text-center">
          Upload a photo
        </AppText>
        <View className="flex-1 justify-center items-center w-full">
          <ImageIllustration
            state={illustration}
            uploadedImageUri={state.status === "attached" ? state.avatarUrl : undefined}
          />
          <View className="w-[186]">
            {message && (
              <AppText
                color={state.status === "failed" ? "danger" : "subtext"}
                variant="body-lg-medium"
                className="pt-4 text-center"
                accessibilityLiveRegion="polite"
              >
                {message}
              </AppText>
            )}
          </View>
        </View>
        {state.status !== "uploading" && (
          <View className="gap-3">
            {state.status === "failed" && (
              <AppButton
                className="w-full"
                onPress={() => void attach(state.image, state.clientUploadId)}
              >
                Try again
              </AppButton>
            )}
            <AppButton
              className="w-full"
              variant={state.status === "failed" ? "secondary" : undefined}
              onPress={() =>
                state.status === "attached"
                  ? router.dismissTo("/chats")
                  : setIsModalVisible(true)
              }
            >
              {state.status === "attached"
                ? "Next"
                : state.status === "failed"
                  ? "Choose another photo"
                  : "Upload Photo"}
            </AppButton>
          </View>
        )}
      </View>
      <ImagePickerModal
        isVisible={isModalVisible}
        onClose={(image) => {
          setIsModalVisible(false);
          if (image) void attach(image, Crypto.randomUUID());
        }}
      />
    </AppView>
  );
}
