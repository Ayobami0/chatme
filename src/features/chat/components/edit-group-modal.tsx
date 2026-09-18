import {
  AppButton,
  AppFullScreenModal,
  AppText,
  AppTextField,
} from "@components";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { SolidAddAPhotoSvg } from "@shared/components/svgs/icons";
import { useUpload } from "@shared/hooks/use-upload";
import { AppColor } from "@shared/theme/color";
import { GroupConversationModel } from "@shared/types/models";
import {
  useSetGroupAvatar,
  useUpdateGroupConversation,
} from "@features/home/query";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { log } from "@core/logging";

type EditGroupModalProps = {
  isVisible: boolean;
  onClose: () => void;
  conversation: GroupConversationModel;
};

export function EditGroupModal({
  isVisible,
  onClose,
  conversation,
}: EditGroupModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [groupName, setGroupName] = useState(conversation.name);
  const [groupDescription, setGroupDescription] = useState(
    conversation.description ?? "",
  );
  const [imageUri, setImageUri] = useState<string | undefined>(
    conversation.avatarUrl ?? undefined,
  );
  const [hasNewImage, setHasNewImage] = useState(false);

  const { uploadAsync, isPending: isUploading } = useUpload();
  const updateGroupMutation = useUpdateGroupConversation();
  const setAvatarMutation = useSetGroupAvatar();

  const isSaving =
    isUploading ||
    updateGroupMutation.isPending ||
    setAvatarMutation.isPending;

  useEffect(() => {
    if (isVisible) {
      setGroupName(conversation.name);
      setGroupDescription(conversation.description ?? "");
      setImageUri(conversation.avatarUrl ?? undefined);
      setHasNewImage(false);
    }
  }, [isVisible, conversation]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setHasNewImage(true);
    }
  };

  const handleSave = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      Toast.show({ type: "error", text1: "Group name is required" });
      return;
    }

    try {
      if (trimmedName !== conversation.name) {
        await updateGroupMutation.mutateAsync({
          conversationId: conversation.id,
          data: {
            name: trimmedName,
          },
        });
      }

      if (hasNewImage && imageUri) {
        const uploaded = await uploadAsync({ uri: imageUri });
        if (uploaded?.id) {
          await setAvatarMutation.mutateAsync({
            conversationId: conversation.id,
            mediaId: uploaded.id,
          });
        }
      }

      Toast.show({ type: "success", text1: "Group details updated" });
      onClose();
    } catch (err: any) {
      log.error(err);
      Toast.show({
        type: "error",
        text1: err?.message ?? "Failed to update group",
      });
    }
  };

  const isChanged = hasNewImage || groupName.trim() !== conversation.name;

  return (
    <AppFullScreenModal
      transparent
      visible={isVisible}
      animationType="none"
      closeOnBackdropTap
      onClose={onClose}
    >
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        enablePanDownToClose
        onClose={onClose}
      >
        <BottomSheetView className="p-6 py-5">
          <View className="relative flex-row items-center justify-center mb-5">
            <AppText variant="h4" className="text-center">
              Edit Group Info
            </AppText>
          </View>

          <View className="gap-5 my-4">
            <TouchableOpacity
              activeOpacity={0.8}
              className="size-32 bg-primary-50 items-center justify-center rounded-full self-center overflow-hidden"
              onPress={handlePickImage}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  className="size-32 rounded-full"
                />
              ) : (
                <SolidAddAPhotoSvg
                  width={48}
                  height={48}
                  color={AppColor.primary400}
                />
              )}
            </TouchableOpacity>

            <AppTextField
              placeholder="Name of group"
              label="Group Name"
              value={groupName}
              onChangeText={setGroupName}
            />

            <AppTextField
              label="Description (Optional)"
              placeholder="Group Description"
              value={groupDescription}
              onChangeText={setGroupDescription}
            />
          </View>

          <AppButton
            isLoading={isSaving}
            disabled={!isChanged || groupName.trim().length === 0 || isSaving}
            onPress={handleSave}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              "Save Changes"
            )}
          </AppButton>
        </BottomSheetView>
      </BottomSheet>
    </AppFullScreenModal>
  );
}
