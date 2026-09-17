import { AppText, AppView, useRealtime } from "@components";
import { FlatList, View } from "react-native";
import { ChatsHeader } from "../components/chats-header";
import { useEffect, useState } from "react";
import { PinCodeModal } from "../components/pin-code-modal";
import { FABOptionModal } from "../components/fab-option-modal";
import { FloatingActionButton } from "../components/fab";
import { ContactListModal } from "../components/contact-list-modal";
import { NewGroupModal } from "../components/new-group-modal";
import { DUMMY_CONVERSATIONS } from "@constants";
import { ConversationCard } from "../components/conversation-card";
import { ArchivedChatCard } from "../components/archived-chat-card";
import { useConversations, useArchivedConversations } from "../query";
import { ConversationService } from "@services/conversation";
import { useCacheStore } from "@shared/store/cache";
import { ConversationModel } from "@shared/types/models";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import { SolidArchiveSvg, SolidPushPinSvg, SolidVolumeUp1Svg } from "@shared/components/svgs/icons";
import { useQueryClient } from "@tanstack/react-query";
import StorageService, { StorageKey } from "@services/storage";

export default function ChatsScreen() {
  const queryClient = useQueryClient();
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const [showContactList, setShowContactList] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSelectionMode = selectedIds.length > 0;

  const {
    conversationsQuery,
    conversations: data,
    pinMutation,
    unpinMutation,
    archiveMutation,
    unarchiveMutation,
    muteMutation,
    unmuteMutation,
    deleteMutation,
  } = useConversations();
  const { refetch } = conversationsQuery;

  const { archivedQuery } = useArchivedConversations();
  const { data: archivedConversationsResp, refetch: refetchArcchived } = archivedQuery;

  const { socket, status, activityVersion, reconcileVersion } = useRealtime();

  const hydrateCache = useCacheStore((s) => s.hydrate);
  const cachedConversations = useCacheStore((s) => s.conversations);
  const setConversations = useCacheStore((s) => s.setConversations);

  useEffect(() => {
    void (async () => {
      const hasSeenPinPrompt = await StorageService.get<boolean>(
        StorageKey.HasSeenPinPrompt,
      );
      if (!hasSeenPinPrompt) {
        setPinModalVisible(true);
      }
    })();
    void hydrateCache();
  }, [hydrateCache]);

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

  const archivedConversations = archivedConversationsResp ?? [];

  const activeConversations = conversations.filter(
    (c) => c.settings?.archived !== true,
  );

  const pinnedConversations = activeConversations
    .filter((c) => c.settings?.pinned === true)
    .sort((a, b) => {
      const dateA = new Date(
        a.settings?.pinnedAt ||
          a.settings?.archivedAt ||
          a.lastActivityAt ||
          a.createdAt ||
          0,
      ).getTime();
      const dateB = new Date(
        b.settings?.pinnedAt ||
          b.settings?.archivedAt ||
          b.lastActivityAt ||
          b.createdAt ||
          0,
      ).getTime();
      return dateB - dateA;
    });

  const unpinnedConversations = activeConversations
    .filter((c) => c.settings?.pinned !== true)
    .sort((a, b) => {
      const dateA = new Date(
        a.lastActivityAt || a.latestMessage?.createdAt || a.createdAt || 0,
      ).getTime();
      const dateB = new Date(
        b.lastActivityAt || b.latestMessage?.createdAt || b.createdAt || 0,
      ).getTime();
      return dateB - dateA;
    });

  const displayConversations = [
    ...pinnedConversations,
    ...unpinnedConversations,
  ];

  const selectedConversations = conversations.filter((c) =>
    selectedIds.includes(c.id),
  );
  const isAllPinned =
    selectedConversations.length > 0 &&
    selectedConversations.every((c) => c.settings?.pinned === true);
  const isAllMuted =
    selectedConversations.length > 0 &&
    selectedConversations.every((c) => c.settings?.muted === true);
  const isAllArchived =
    selectedConversations.length > 0 &&
    selectedConversations.every((c) => c.settings?.archived === true);

  const toggleSelectConversation = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const updateLocalConversations = (
    updater: (c: ConversationModel) => ConversationModel | null,
  ) => {
    const current =
      cachedConversations.length > 0
        ? cachedConversations
        : [...(data ?? []), ...DUMMY_CONVERSATIONS];
    const updated = current
      .map((c) => updater(c))
      .filter((c): c is ConversationModel => c !== null);
    setConversations(updated);
    queryClient.setQueryData(["conversations"], updated);
  };

  const pinMutate = (ids: string[]) => {
    ids.forEach((id) => pinMutation.mutate(id));
    handleClearSelection();
    Toast.show({
      type: "native",
      position: "bottom",
      text1: "Chat pinned successfully",
      props: { icon: SolidPushPinSvg },
    });
  };

  const unpinMutate = (ids: string[]) => {
    ids.forEach((id) => unpinMutation.mutate(id));
    handleClearSelection();
    Toast.show({
      type: "native",
      position: "bottom",
      text1: "Chat un-pinned successfully",
      props: { icon: SolidPushPinSvg },
    });
  };

  const archiveMutate = (ids: string[]) => {
    ids.forEach((id) => archiveMutation.mutate(id));
    handleClearSelection();
    Toast.show({
      type: "native",
      position: "bottom",
      text1: "Chat archived successfully",
      props: { icon: SolidArchiveSvg },
    });
  };

  const unarchiveMutate = (ids: string[]) => {
    ids.forEach((id) => unarchiveMutation.mutate(id));
    handleClearSelection();
  };

  const muteMutate = (ids: string[]) => {
    ids.forEach((id) => muteMutation.mutate(id));
    handleClearSelection();
    Toast.show({
      type: "native",
      position: "bottom",
      text1: "Chat muted successfully",
      props: { icon: SolidVolumeUp1Svg },
    });
  };

  const unmuteMutate = (ids: string[]) => {
    ids.forEach((id) => unmuteMutation.mutate(id));
    handleClearSelection();
    Toast.show({
      type: "native",
      position: "bottom",
      text1: "Chat un-muted successfully",
      props: { icon: SolidVolumeUp1Svg },
    });
  };

  const deleteMutate = (ids: string[]) => {
    ids.forEach((id) => deleteMutation.mutate(id));
    handleClearSelection();
  };

  const handlePin = (conversationId?: string) => {
    if (conversationId) {
      const target = conversations.find((c) => c.id === conversationId);
      if (target?.settings?.pinned) {
        unpinMutate([conversationId]);
      } else {
        pinMutate([conversationId]);
      }
      return;
    }
    if (selectedIds.length > 0) {
      if (isAllPinned) {
        unpinMutate(selectedIds);
      } else {
        pinMutate(selectedIds);
      }
    }
  };

  const handleArchive = (conversationId?: string) => {
    if (conversationId) {
      const target = conversations.find((c) => c.id === conversationId);
      if (target?.settings?.archived) {
        unarchiveMutate([conversationId]);
      } else {
        archiveMutate([conversationId]);
      }
      return;
    }
    if (selectedIds.length > 0) {
      if (isAllArchived) {
        unarchiveMutate(selectedIds);
      } else {
        archiveMutate(selectedIds);
      }
    }
  };

  const handleMute = (conversationId?: string) => {
    if (conversationId) {
      const target = conversations.find((c) => c.id === conversationId);
      if (target?.settings?.muted) {
        unmuteMutate([conversationId]);
      } else {
        muteMutate([conversationId]);
      }
      return;
    }
    if (selectedIds.length > 0) {
      if (isAllMuted) {
        unmuteMutate(selectedIds);
      } else {
        muteMutate(selectedIds);
      }
    }
  };

  const handleDelete = (conversationId?: string) => {
    const ids = conversationId ? [conversationId] : selectedIds;
    if (ids.length > 0) deleteMutate(ids);
  };

  return (
    <AppView className="p-0">
      <ChatsHeader
        selectedCount={selectedIds.length}
        isAllPinned={isAllPinned}
        isAllMuted={isAllMuted}
        isAllArchived={isAllArchived}
        onClearSelection={handleClearSelection}
        onPin={() => handlePin()}
        onArchive={() => handleArchive()}
        onMute={() => handleMute()}
        onDelete={() => handleDelete()}
      />
      <View className="relative flex-1 mx-6 mt-3">
        <FlatList
          data={displayConversations}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            archivedConversations.length <= 0 ? null : (
              <ArchivedChatCard
                count={archivedConversations.length}
                onPress={() => router.push("/archived")}
              />
            )
          }
          ItemSeparatorComponent={<View className="h-2" />}
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
          ListEmptyComponent={
            <View className="py-12 items-center justify-center">
              <AppText variant="body-md-medium" color="subtext">
                No conversations yet
              </AppText>
            </View>
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
            } else if (action === "new-group") {
              setShowNewGroupModal(true);
            }
          }}
        />
      )}
      {pinModalVisible && (
        <PinCodeModal
          isVisible={pinModalVisible}
          onClose={async () => {
            setPinModalVisible(false);
            await StorageService.save(StorageKey.HasSeenPinPrompt, true);
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
      {showNewGroupModal && (
        <NewGroupModal
          isVisible={showNewGroupModal}
          onClose={() => {
            setShowNewGroupModal(false);
          }}
        />
      )}
    </AppView>
  );
}
