import { AppBlurView, AppMediaAction, AppMediaUpload, AppView } from "@components";
import { SolidCameraSvg, SolidPhotographSvg } from "@shared/components/svgs/icons";
import { Modal, Pressable, View } from "react-native";

type ImagePickerModalProps = {
  isVisible: boolean;
  onClose: (imageUri?: string) => void;
};

export default function ImagePickerModal(props: ImagePickerModalProps) {
  const { isVisible, onClose } = props;

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
              onPress={() => {}}
            />
            <AppMediaAction
              icon={SolidPhotographSvg}
              label="Choose from library"
              onPress={() => {}}
            />
          </AppMediaUpload>
        </Pressable>
      </AppBlurView>
    </Modal>
  );
}
