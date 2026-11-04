import { AppBlurView, AppMediaAction, AppMediaUpload } from "@components";
import { SolidCameraSvg, SolidPhotographSvg } from "@shared/components/svgs/icons";
import { PickedImage } from "@shared/utils/media-file";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking, Modal, Pressable } from "react-native";

type ImagePickerModalProps = {
  isVisible: boolean;
  onClose: (image?: PickedImage) => void;
};

const explainDenied = (what: "camera" | "photos") =>
  Alert.alert(
    what === "camera" ? "Camera access needed" : "Photo access needed",
    `Allow access to your ${what} in Settings to choose a profile photo.`,
    [
      { text: "Not now", style: "cancel" },
      { text: "Open Settings", onPress: () => void Linking.openSettings() },
    ],
  );

export default function ImagePickerModal(props: ImagePickerModalProps) {
  const { isVisible, onClose } = props;

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return explainDenied("camera");
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onClose(result.assets[0]);
    }
  };

  const handleChooseFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return explainDenied("photos");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onClose(result.assets[0]);
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
          <AppMediaUpload
            showRecentImage
            onRecentImagePicked={(uri, info) =>
              onClose(uri ? { uri, fileName: info?.filename } : undefined)
            }
          >
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
