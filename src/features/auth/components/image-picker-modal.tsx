import { AppBlurView, AppMediaAction, AppMediaUpload, AppView } from "@components";
import { SolidCameraSvg, SolidPhotographSvg } from "@shared/components/svgs/icons";
import * as ImagePicker from "expo-image-picker";
import { Modal, Pressable, View } from "react-native";

type ImagePickerModalProps = {
  isVisible: boolean;
  onClose: (imageUri?: string) => void;
};

export default function ImagePickerModal(props: ImagePickerModalProps) {
  const { isVisible, onClose } = props;

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      onClose(result.assets[0].uri);
    }
  };

  const handleChooseFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      onClose(result.assets[0].uri);
    }
  };

  return (
    <Modal
      visible={isVisible}
      onRequestClose={() => onClose()}
      animationType='slide'
      transparent
    >
      <AppBlurView >
        <Pressable
          className="absolute inset-0 h-full w-full justify-end pb-12 px-6"
          onPress={() => onClose()}
        >
          <AppMediaUpload showRecentImage onRecentImagePicked={onClose}>
            <AppMediaAction
              icon={SolidCameraSvg}
              label="Take Photo"
              onPress={handleTakePhoto}
            />
            <AppMediaAction
              icon={SolidPhotographSvg}
              label="Choose from library"
              onPress={handleChooseFromLibrary}
            />
          </AppMediaUpload>
        </Pressable>
      </AppBlurView>
    </Modal>
  );
}
