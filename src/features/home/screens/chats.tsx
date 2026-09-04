import { AppText, AppView } from "@components";
import { FlatList, View } from "react-native";
import { ChatsHeader } from "../components/chats-header";
import { useEffect, useState } from "react";
import { PinCodeModal } from "../components/pin-code-modal";
import { FABOptionModal } from "../components/fab-option-modal";
import { FloatingActionButton } from "../components/fab";
import { ContactListModal } from "../components/contact-list-modal";
import { DUMMY_CONVERSATIONS } from "@constants";
import { ConversationCard } from "../components/conversation-card";
import { useQuery } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { useCacheStore } from "@shared/store/cache";

export default function ChatsScreen() {
  const [pinModalVisible, setPinModalVIsible] = useState(false);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const [showContactList, setShowContactList] = useState(false);

  const hydrateCache = useCacheStore((s) => s.hydrate);
  const cachedConversations = useCacheStore((s) => s.conversations);
  const setConversations = useCacheStore((s) => s.setConversations);

  useEffect(() => {
    setPinModalVIsible(true);
    void hydrateCache();
  }, [hydrateCache]);

  const { data } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await ConversationService.getConversations();
      return response.items;
    },
  });

  useEffect(() => {
    if (data) {
      setConversations(data);
    }
  }, [data, setConversations]);

  const conversations =
    cachedConversations.length > 0
      ? cachedConversations
      : [...(data ?? []), ...DUMMY_CONVERSATIONS];
  return (
    <AppView className="p-0">
      <ChatsHeader />
      <View className="relative flex-1 mx-6">
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationCard conversation={item} />}
          contentContainerStyle={
            conversations.length === 0
              ? { flex: 1, justifyContent: "center", alignItems: "center" }
              : undefined
          }
          ListEmptyComponent={
            <AppText variant="body-md-medium" color="subtext">
              No conversations yet
            </AppText>
          }
        />

        <FloatingActionButton
          onPress={() => setShowFabOptions(true)}
          className="bottom-5 right-0 absolute"
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
