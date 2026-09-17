import { AppText, AppView, useRealtime } from "@components";
import { ConversationService } from "@services/conversation";
import { OutlineCheveronLeftSvg } from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { useArchivedConversations } from "../query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { ConversationCard } from "../components/conversation-card";

export default function ArchivedChatsScreen() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { socket, status } = useRealtime();

  const {
    archivedQuery,
    archivedConversations: conversations,
    unarchiveMutation,
    pinMutation,
    unpinMutation,
    muteMutation,
    unmuteMutation,
    deleteMutation,
  } = useArchivedConversations();
  const { refetch } = archivedQuery;

  useEffect(() => {
    if (!socket || status !== "connected") return;

    const onMessageCreated = () => {
      void refetch();
    };

    socket.on("message.created", onMessageCreated);

    return () => {
      socket.off("message.created", onMessageCreated);
    };
  }, [socket, status, refetch]);

  const toggleSelectConversation = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const unarchiveMutate = (ids: string[]) => {
    ids.forEach((id) => unarchiveMutation.mutate(id));
    handleClearSelection();
  };

  const pinMutate = (ids: string[]) => {
    ids.forEach((id) => pinMutation.mutate(id));
    handleClearSelection();
  };

  const unpinMutate = (ids: string[]) => {
    ids.forEach((id) => unpinMutation.mutate(id));
    handleClearSelection();
  };

  const muteMutate = (ids: string[]) => {
    ids.forEach((id) => muteMutation.mutate(id));
    handleClearSelection();
  };

  const unmuteMutate = (ids: string[]) => {
    ids.forEach((id) => unmuteMutation.mutate(id));
    handleClearSelection();
  };

  const deleteMutate = (ids: string[]) => {
    ids.forEach((id) => deleteMutation.mutate(id));
    handleClearSelection();
  };

  const handleUnarchive = (conversationId?: string) => {
    const ids = conversationId ? [conversationId] : selectedIds;
    if (ids.length > 0) unarchiveMutate(ids);
  };

  const handlePin = (conversationId: string) => {
    const target = conversations.find((c) => c.id === conversationId);
    if (target?.settings?.pinned) {
      unpinMutate([conversationId]);
    } else {
      pinMutate([conversationId]);
    }
  };

  const handleMute = (conversationId: string) => {
    const target = conversations.find((c) => c.id === conversationId);
    if (target?.settings?.muted) {
      unmuteMutate([conversationId]);
    } else {
      muteMutate([conversationId]);
    }
  };

  const handleDelete = (conversationId: string) => {
    deleteMutate([conversationId]);
  };

  const onPrimaryColor = useThemeColor("primary-foreground");

  return (
    <AppView className="p-0">
      <View className="pt-[60] px-6 bg-primary pb-4 flex-row items-center gap-4">
        <Pressable onPress={() => router.back()} className="p-1">
          <OutlineCheveronLeftSvg width={24} height={24} color={onPrimaryColor} />
        </Pressable>
        <AppText variant="h3" color="onPrimary">
          Archived Chats
        </AppText>
      </View>

      <View className="relative flex-1 mx-6 mt-3">
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={<View className="h-2" />}
          renderItem={({ item }) => (
            <ConversationCard
              conversation={item}
              isSelected={selectedIds.includes(item.id)}
              onLongPress={() => toggleSelectConversation(item.id)}
              onMute={() => handleMute(item.id)}
              onPin={() => handlePin(item.id)}
              onDelete={() => handleDelete(item.id)}
              onArchive={() => handleUnarchive(item.id)}
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
              No archived chats
            </AppText>
          }
        />
      </View>
    </AppView>
  );
}
