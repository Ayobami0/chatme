import { AppText, AppView, useRealtime } from "@components";
import { ConversationService } from "@services/conversation";
import { OutlineCheveronLeftSvg } from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { useCacheStore } from "@shared/store/cache";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { ConversationCard } from "../components/conversation-card";

export default function ArchivedChatsScreen() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { socket, status } = useRealtime();

  const cachedConversations = useCacheStore((s) => s.conversations);
  const setConversations = useCacheStore((s) => s.setConversations);

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

  const conversations =
    cachedConversations.length > 0 ? cachedConversations : (data ?? []);

  const archivedConversations = conversations.filter(
    (c) => c.settings?.archived === true,
  );

  const toggleSelectConversation = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const { mutate: unarchiveMutate } = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        try {
          await ConversationService.unarchiveConversation(id);
        } catch (err) {
          // ignore error
        }
      }
    },
    onSuccess: () => {
      void refetch();
      handleClearSelection();
    },
  });

  const { mutate: pinMutate } = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        try {
          await ConversationService.pinConversation(id);
        } catch (err) {
          // ignore error
        }
      }
    },
    onSuccess: () => {
      void refetch();
      handleClearSelection();
    },
  });

  const { mutate: unpinMutate } = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        try {
          await ConversationService.unpinConversation(id);
        } catch (err) {
          // ignore error
        }
      }
    },
    onSuccess: () => {
      void refetch();
      handleClearSelection();
    },
  });

  const { mutate: muteMutate } = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        try {
          await ConversationService.muteConversation(id, { duration: "always" });
        } catch (err) {
          // ignore error
        }
      }
    },
    onSuccess: () => {
      void refetch();
      handleClearSelection();
    },
  });

  const { mutate: unmuteMutate } = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        try {
          await ConversationService.unmuteConversation(id);
        } catch (err) {
          // ignore error
        }
      }
    },
    onSuccess: () => {
      void refetch();
      handleClearSelection();
    },
  });

  const { mutate: deleteMutate } = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        try {
          await ConversationService.clearConversationMessages(id);
        } catch (err) {
          // ignore error
        }
      }
    },
    onSuccess: () => {
      void refetch();
      handleClearSelection();
    },
  });

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
          data={archivedConversations}
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
            archivedConversations.length === 0
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
