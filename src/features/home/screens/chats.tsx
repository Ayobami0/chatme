import { AppText, AppView, useRealtime } from "@components";
import { FlatList, View } from "react-native";
import { ChatsHeader } from "../components/chats-header";
import { useEffect, useState } from "react";
import { PinCodeModal } from "../components/pin-code-modal";
import { FABOptionModal } from "../components/fab-option-modal";
import { FloatingActionButton } from "../components/fab";
import { ContactListModal } from "../components/contact-list-modal";
import { DUMMY_CONVERSATIONS } from "@constants";
import { ConversationCard } from "../components/conversation-card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { useCacheStore } from "@shared/store/cache";

export default function ChatsScreen() {
  const [pinModalVisible, setPinModalVIsible] = useState(false);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const [showContactList, setShowContactList] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSelectionMode = selectedIds.length > 0;

  const queryClient = useQueryClient();
  const { socket, status, activityVersion, reconcileVersion } = useRealtime();

  const hydrateCache = useCacheStore((s) => s.hydrate);
  const cachedConversations = useCacheStore((s) => s.conversations);
  const setConversations = useCacheStore((s) => s.setConversations);

  useEffect(() => {
    setPinModalVIsible(true);
    void hydrateCache();
  }, [hydrateCache]);

  const { data, refetch, isRefetching } = useQuery({
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

  useEffect(() => {
    if (!socket || status !== "connected") return;

    const onMessageCreated = () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("message.created", onMessageCreated);

    return () => {
      socket.off("message.created", onMessageCreated);
    };
  }, [socket, status, queryClient]);

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [activityVersion, reconcileVersion, queryClient]);

  const conversations =
    cachedConversations.length > 0
      ? cachedConversations
      : [...(data ?? []), ...DUMMY_CONVERSATIONS];

  const toggleSelectConversation = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handlePin = async (conversationId?: string) => {
    const ids = conversationId ? [conversationId] : selectedIds;
    for (const id of ids) {
      try {
        await ConversationService.pinConversation(id);
      } catch (err) {
        // ignore error
      }
    }
    void refetch();
    handleClearSelection();
  };

  const handleArchive = async (conversationId?: string) => {
    const ids = conversationId ? [conversationId] : selectedIds;
    for (const id of ids) {
      try {
        await ConversationService.archiveConversation(id);
      } catch (err) {
        // ignore error
      }
    }
    void refetch();
    handleClearSelection();
  };

  const handleMute = async (conversationId?: string) => {
    const ids = conversationId ? [conversationId] : selectedIds;
    for (const id of ids) {
      try {
        await ConversationService.muteConversation(id, { duration: "always" });
      } catch (err) {
        // ignore error
      }
    }
    void refetch();
    handleClearSelection();
  };

  const handleDelete = async (conversationId?: string) => {
    const ids = conversationId ? [conversationId] : selectedIds;
    for (const id of ids) {
      try {
        await ConversationService.clearConversationMessages(id);
      } catch (err) {
        // ignore error
      }
    }
    void refetch();
    handleClearSelection();
  };

  return (
    <AppView className="p-0">
      <ChatsHeader
        selectedCount={selectedIds.length}
        onClearSelection={handleClearSelection}
        onPin={() => handlePin()}
        onArchive={() => handleArchive()}
        onMute={() => handleMute()}
        onDelete={() => handleDelete()}
      />
      <View className="relative flex-1 mx-6 mt-3">
        <FlatList
          refreshing={isRefetching}
          onRefresh={refetch}
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationCard
              conversation={item}
              isSelected={selectedIds.includes(item.id)}
              onLongPress={() => toggleSelectConversation(item.id)}
              onPress={
                isSelectionMode
                  ? () => toggleSelectConversation(item.id)
                  : undefined
              }
              onMute={() => handleMute(item.id)}
              onPin={() => handlePin(item.id)}
              onDelete={() => handleDelete(item.id)}
              onArchive={() => handleArchive(item.id)}
              onMore={() => {}}
            />
          )}
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

        {!isSelectionMode && (
          <FloatingActionButton
            onPress={() => setShowFabOptions(true)}
            className="bottom-5 right-0 absolute"
          />
        )}
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
