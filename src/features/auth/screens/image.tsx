import { AppButton, AppHeader, AppText, AppView } from "@components";
import { router } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { useUpload } from "@shared/hooks/use-upload";
import { log } from "@core/logging";
import {
  ImageIllustration,
  ImageIllustrationState,
} from "../components/image-upload";
import ImagePickerModal from "../components/image-picker-modal";

export default function ProfileImageScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [localUri, setLocalUri] = useState<string | undefined>(undefined);

  const { upload, isPending, file } = useUpload({
    purpose: "profile_avatar",
  });

  const imageState: ImageIllustrationState = isPending
    ? "uploading"
    : file?.secureUrl || localUri
      ? "uploaded"
      : "idle";

  const showPickerModal = () => {
    setIsModalVisible(true);
  };

  const handleUpload = async (imageUri: string) => {
    setLocalUri(imageUri);
    try {
      await upload({ uri: imageUri });
    } catch (err) {
      log.error("Failed to upload image", err);
    }
  };

  return (
    <AppView withSafeArea>
      <AppHeader onBack={router.canGoBack() ? router.back : undefined} />
      <View className="pt-6 flex-1">
        <AppText variant="h3" className="pb-3 text-center">
          Upload a photo
        </AppText>
        <View className="flex-1 justify-center items-center w-full">
          <ImageIllustration
            state={imageState}
            uploadedImageUri={file?.secureUrl || localUri}
          />
          <View className="w-[186]">
            {imageState !== "idle" && (
              <AppText
                color="subtext"
                variant="body-lg-medium"
                className="pt-4 text-center"
              >
                {imageState === "uploading"
                  ? "Wait a second, your photo still uploading"
                  : "Done! Your photo successfully uploaded"}
              </AppText>
            )}
          </View>
        </View>
        {imageState !== "uploading" && (
          <AppButton
            className="w-full"
            onPress={() => {
              imageState === "idle" ? showPickerModal() : router.dismissTo("/chats");
            }}
          >
            {imageState === "idle" ? "Upload Photo" : "Next"}
          </AppButton>
        )}
      </View>
      <ImagePickerModal
        isVisible={isModalVisible}
        onClose={(image) => {
          if (image) {
            handleUpload(image);
          }
          setIsModalVisible(false);
        }}
      />
    </AppView>
  );
}
