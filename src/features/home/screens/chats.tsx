import { AppView } from "@components";
import { View } from "react-native";
import { ChatsHeader } from "../components/chats-header";
import { useEffect, useState } from "react";
import { PinCodeModal } from "../components/pin-code-modal";
import { FABOptionModal } from "../components/fab-option-modal";
import { FloatingActionButton } from "../components/fab";
import { ContactListModal } from "../components/contact-list-modal";

export default function ChatsScreen() {
  const [pinModalVisible, setPinModalVIsible] = useState(false);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const [showContactList, setShowContactList] = useState(false);
  useEffect(() => {
    setPinModalVIsible(true);
  }, []);
  return (
    <AppView className="p-0">
      <ChatsHeader />
      <View className="relative flex-1 mx-6">
        <FloatingActionButton
          onPress={() => setShowFabOptions(true)}
          className="bottom-[100] right-0 absolute"
        />
      </View>
      {showFabOptions && (
        <FABOptionModal
          isVisible={showFabOptions}
          onClose={(action) => {
            setShowFabOptions(false);
            if (action === "new-chat") {
              setShowContactList(true);
            }
          }}
        />
      )}
      {pinModalVisible && (
        <PinCodeModal
          isVisible={pinModalVisible}
          onClose={() => {
            setPinModalVIsible(false);
          }}
        />
      )}
      {showContactList && (
        <ContactListModal
          onClose={() => {
            setShowContactList(false);
          }}
        />
      )}
    </AppView>
  );
}
