import { AppText, AppView, useRealtime } from "@components";
import { OutlineCheveronLeftSvg } from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { useArchivedConversations, useConversationRemoval } from "../query";
import { confirmConversationRemoval } from "../components/confirm-conversation-removal";
import { runBulk } from "../utils/run-bulk";
import { BulkActionLabel, showBulkOutcome } from "../components/bulk-outcome-toast";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { ConversationCard } from "../components/conversation-card";

export default function ArchivedChatsScreen() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { socket, status } = useRealtime();

  const {
    archivedQuery,
    archivedConversations: conversations = [],
    unarchiveMutation,
    pinMutation,
    unpinMutation,
    muteMutation,
    unmuteMutation,
  } = useArchivedConversations();
  const removalMutation = useConversationRemoval();
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

  const runBulkAction = async (
    ids: string[],
    mutateAsync: (id: string) => Promise<unknown>,
    label: BulkActionLabel,
  ) => {
    const result = await runBulk(ids, (id) => mutateAsync(id));
    setSelectedIds((prev) => (prev.length > 0 ? result.failed : prev));
    showBulkOutcome(result, label);
  };

  const unarchiveMutate = (ids: string[]) =>
    runBulkAction(ids, unarchiveMutation.mutateAsync, { verb: "unarchive", past: "unarchived" });
  const pinMutate = (ids: string[]) =>
    runBulkAction(ids, pinMutation.mutateAsync, { verb: "pin", past: "pinned" });
  const unpinMutate = (ids: string[]) =>
    runBulkAction(ids, unpinMutation.mutateAsync, { verb: "unpin", past: "unpinned" });
  const muteMutate = (ids: string[]) =>
    runBulkAction(ids, muteMutation.mutateAsync, { verb: "mute", past: "muted" });
  const unmuteMutate = (ids: string[]) =>
    runBulkAction(ids, unmuteMutation.mutateAsync, { verb: "unmute", past: "unmuted" });

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
    const target = conversations.find((c) => c.id === conversationId);
    if (target) confirmConversationRemoval([target], removalMutation.mutateAsync);
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
