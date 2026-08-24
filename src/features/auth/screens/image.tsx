import { AppButton, AppHeader, AppText, AppView } from "@components";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import {
  ImageIllustration,
  ImageIllustrationState,
} from "../components/image-upload";
import ImagePickerModal from "../components/image-picker-modal";

export default function ProfileImageScreen() {
  const [imageState, setImageState] = useState<ImageIllustrationState>("idle");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [uploadedImageUri, setUploadedImageUri] = useState<string | undefined>(
    undefined,
  );

  const showPickerModal = () => {
    setIsModalVisible(true);
  };

  const handleUpload = (imageUri: string) => {
    setImageState("uploading");
    setTimeout(() => {
      setImageState("uploaded");
      setUploadedImageUri(imageUri);
    }, 3000);
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
            uploadedImageUri={uploadedImageUri}
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
