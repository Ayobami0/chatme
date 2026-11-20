import {
  AppAvatar,
  AppLinearProgressIndicator,
  AppText,
  AppView,
} from "@components";
import { ChatBg1Svg } from "@shared/components/svgs/assets";
import {
  OutlineCheveronLeftSvg,
  SolidUserGroupSvg,
} from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import {
  ConversationModel,
  GroupConversationParticipant,
  MessageModel,
} from "@shared/types/models";
import {
  formatActiveDateTimeHumanReadable,
  formatMessageDateSeparator,
} from "@shared/utils/datetime";
import { useConversationDetails } from "../query";
import { router, useIsFocused } from "expo-router";
import { setActiveConversation } from "@features/notifications/active-conversation";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  View,
} from "react-native";
import {
  ChatBubble,
  MessageState,
  TypingChatBubble,
} from "../components/chat-bubble";
import { useAuth } from "@shared/context/auth-context";
import { useEffect, useMemo, useRef } from "react";
import { AppColor } from "@shared/theme/color";
import { useColorScheme } from "nativewind";
import { useConversationSync } from "../hooks/use-conversation-sync";
import { LocalMessage, useMessageSender } from "../hooks/use-message-sender";
import { usePresenceAndTyping } from "../hooks/use-presence-and-typing";
import { ParticipantReceipt, useReadReceipts } from "../hooks/use-read-receipts";
import { MessageComposer } from "../components/message-composer";
import { ConversationNotFound } from "../components/conversation-not-found";
import { isCredentialRejection, isNotFound } from "@core/network/errors";

type ChatScreenProps = {
  conversationId: string;
};

/** Assembles the chat from focused hooks: sync, sending, presence/typing and receipts. */
export default function ChatScreen(props: ChatScreenProps) {
  const { conversationId } = props;
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const bgSvgColor = useThemeColor("muted");

  // Everything about the conversation comes from the server, never from route params.
  const { data: conversation, error: detailsError } =
    useConversationDetails(conversationId);
  const isDirect = conversation?.type === "direct";
  const directParticipantId = isDirect ? conversation.otherParticipant.id : undefined;
  const title =
    (conversation?.type === "direct"
      ? conversation.otherParticipant.displayName
      : conversation?.name) ?? "";
  const avatarUrl =
    conversation?.type === "direct"
      ? conversation.otherParticipant.avatarUrl
      : conversation?.avatarUrl;
  const lastActiveAt = conversation?.lastActivityAt
    ? new Date(conversation.lastActivityAt)
    : undefined;

  const sync = useConversationSync(conversationId);
  const sender = useMessageSender(conversationId, sync.messages, {
    reconnectVersion: sync.reconcileVersion,
  });
  const presence = usePresenceAndTyping(conversationId, {
    selfId: user?.id,
    directParticipantId,
  });
  const receipts = useReadReceipts(conversationId, sync.messages, user?.id);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
    setActiveConversation(conversationId);
    return () => setActiveConversation(null);
  }, [isFocused, conversationId]);

  // The failed state is otherwise only an icon, so tell screen-reader users when a send fails.
  const failedCount = sender.localMessages.filter((m) => m.localStatus === "failed").length;
  const previousFailedCount = useRef(failedCount);
  useEffect(() => {
    if (failedCount > previousFailedCount.current) {
      AccessibilityInfo.announceForAccessibility("Message not sent. Double tap it for options.");
    }
    previousFailedCount.current = failedCount;
  }, [failedCount]);

  const chatBg =
    colorScheme === "dark" ? AppColor.neutral700 : AppColor.primary50;

  if (isCredentialRejection(detailsError) || isNotFound(detailsError)) {
    return <ConversationNotFound />;
  }

  const onFailedPress = (message: LocalMessage) =>
    Alert.alert("Message not sent", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => sender.discard(message.clientMessageId),
      },
      { text: "Retry", onPress: () => sender.retry(message.clientMessageId) },
    ]);

  return (
    <AppView
      enabled
      className="p-0 relative"
      behavior="padding"
      style={{ backgroundColor: chatBg }}
    >
      <ChatBg1Svg
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        color={bgSvgColor}
      />
      <ChatHeader
        conversationId={conversationId}
        fullName={title}
        url={avatarUrl ?? undefined}
        online={presence.isOnline}
        conversation={conversation ?? undefined}
        date={lastActiveAt}
      />
      {sync.isFetching && <AppLinearProgressIndicator />}
      <ChatBody
        messages={sync.messages}
        localMessages={sender.localMessages}
        receipts={receipts}
        typing={presence.typingUserIds.length > 0}
        conversation={conversation ?? undefined}
        isLoading={sync.isLoading}
        hasOlder={sync.hasOlder}
        isFetchingOlder={sync.isFetchingOlder}
        olderFailed={Boolean(sync.olderError)}
        onLoadOlder={() => void sync.fetchOlder()}
        onFailedPress={onFailedPress}
      />
      <MessageComposer
        conversationId={conversationId}
        onSend={(text, attachments) => {
          presence.stopTyping();
          sender.send(text, attachments.length > 0 ? "image" : "text", attachments);
        }}
        onTyping={presence.notifyTyping}
        onBlur={presence.stopTyping}
      />
    </AppView>
  );
}

function ChatHeader(props: {
  conversationId: string;
  fullName: string;
  url?: string;
  conversation?: ConversationModel;
  online?: boolean;
  date?: Date;
}) {
  const { user } = useAuth();
  const presence = props.online ? "Online" : "Offline";
  const iconColor = useThemeColor("primary-foreground");

  const formatParticipants = (
    participants: GroupConversationParticipant[] | undefined,
  ): string | null => {
    if (!participants || participants.length === 0) return "";

    const length = participants.length;

    const names = [
      ...participants.map((e) => {
        let parsedName = e.displayName?.split(" ")[0];

        if (user?.id == e.id) {
          parsedName = "You";
        }

        return parsedName;
      }),
    ].sort((a, b) => {
      if (a === "You") return -1;
      if (b === "You") return 1;

      if (!a) return 1;
      if (!b) return -1;

      return a.localeCompare(b);
    });

    if (length === 1) return names[0] ?? "";
    if (length === 2) return names.join(" and ");

    return `${names.slice(0, 2).join(", ")} and ${length - 2}+`;
  };

  const subtitle =
    props.conversation?.type === "group"
      ? formatParticipants(props.conversation.participants)
      : props.online
        ? presence
        : (formatActiveDateTimeHumanReadable(props.date) ?? presence);

  return (
    <View className="bg-primary pt-safe pb-4 px-6">
      <View className="flex-row items-center pt-2">
        <Pressable
          onPress={router.back}
          className="mr-2"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <OutlineCheveronLeftSvg width={24} height={24} color={iconColor} />
        </Pressable>
        <Pressable
          className="flex-1 flex-row items-center"
          onPress={() => router.push(`/chat/${props.conversationId}/chat-info`)}
          accessibilityRole="button"
          accessibilityLabel={`${props.fullName}, ${subtitle}. View chat info`}
        >
          <AppAvatar
            url={props.url}
            name={props.fullName}
            size={48}
            isOnline={props.online ?? false}
            bordered
          />
          <View className="flex-1 mx-3">
            <View className="flex-row gap-2">
              {props.conversation?.type === "group" && (
                <SolidUserGroupSvg color={iconColor} />
              )}
              <AppText size={18} color="onPrimary" variant="h5">
                {props.fullName}
              </AppText>
            </View>
            <AppText size={14} color="onPrimary" variant="body-md-regular">
              {subtitle}
            </AppText>
          </View>
        </Pressable>
        {/* Video and voice calls are hidden until calling is implemented. */}
      </View>
    </View>
  );
}

type ChatRow = { message: MessageModel; local?: LocalMessage };

function ChatBody(props: {
  messages: MessageModel[];
  localMessages: LocalMessage[];
  receipts: ParticipantReceipt[];
  typing: boolean;
  conversation?: ConversationModel;
  isLoading: boolean;
  hasOlder: boolean;
  isFetchingOlder: boolean;
  olderFailed: boolean;
  onLoadOlder: () => void;
  onFailedPress: (message: LocalMessage) => void;
}) {
  const { messages, localMessages, receipts, typing, conversation } = props;
  const { user } = useAuth();

  // Newest first, for the inverted list. Unconfirmed sends sit after confirmed history.
  const rows = useMemo<ChatRow[]>(() => {
    const confirmed = messages.map((message) => ({ message }));
    const local = [...localMessages]
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .map((m) => ({ message: m, local: m }));
    return [...confirmed, ...local].reverse();
  }, [messages, localMessages]);

  // The furthest message (by position in the confirmed history) any other member has read/received.
  const { readThrough, deliveredThrough } = useMemo(() => {
    const indexById = new Map(messages.map((m, i) => [m.id, i]));
    const furthest = (key: "read" | "delivered") =>
      Math.max(
        -1,
        ...receipts
          .filter((r) => r.userId !== user?.id && r[key]?.messageId)
          .map((r) => indexById.get(r[key]!.messageId) ?? -1),
      );
    return { readThrough: furthest("read"), deliveredThrough: furthest("delivered") };
  }, [messages, receipts, user?.id]);

  const confirmedIndex = useMemo(
    () => new Map(messages.map((m, i) => [m.id, i])),
    [messages],
  );

  const getMessageState = (row: ChatRow): MessageState => {
    if (row.local) return row.local.localStatus === "failed" ? "error" : "pending";
    if (row.message.senderId !== user?.id) return "sent";

    const index = confirmedIndex.get(row.message.id) ?? -1;
    if (index <= readThrough) return "read";
    if (index <= deliveredThrough) return "delivered";
    return "sent";
  };

  const isGroupChat = conversation?.type === "group";
  const participantsById = useMemo(
    () =>
      new Map(
        (conversation?.type === "group" ? conversation.participants : []).map((p) => [p.id, p]),
      ),
    [conversation],
  );

  if (rows.length === 0 && !typing) {
    return (
      <View className="flex-1 items-center justify-center">
        {props.isLoading ? (
          <ActivityIndicator />
        ) : (
          <AppText variant="body-md-medium" color="subtext">
            No messages yet
          </AppText>
        )}
      </View>
    );
  }

  return (
    <FlatList
      inverted
      className="flex-1"
      data={rows}
      keyExtractor={(row) => row.message.clientMessageId || row.message.id}
      contentContainerClassName="gap-3 py-4"
      showsVerticalScrollIndicator={false}
      // Stay pinned to the newest message only while the user is already near it.
      maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 80 }}
      // After a failure, wait for an explicit Retry instead of re-firing on every scroll.
      onEndReached={props.hasOlder && !props.olderFailed ? props.onLoadOlder : undefined}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={typing ? <TypingChatBubble forGroup={isGroupChat} /> : null}
      ListFooterComponent={
        props.isFetchingOlder ? (
          <ActivityIndicator className="py-2" />
        ) : props.olderFailed ? (
          <View className="items-center py-2 gap-1">
            <AppText variant="body-sm-regular" color="subtext">
              Couldn&apos;t load older messages
            </AppText>
            <Pressable onPress={props.onLoadOlder} accessibilityRole="button">
              <AppText variant="body-sm-medium" color="primary">
                Retry
              </AppText>
            </Pressable>
          </View>
        ) : null
      }
      renderItem={({ item, index }) => {
        const older = rows[index + 1]?.message;
        const dateLabel = formatMessageDateSeparator(item.message.createdAt);
        const showDateHeader =
          !older || formatMessageDateSeparator(older.createdAt) !== dateLabel;
        const senderInfo = participantsById.get(item.message.senderId);

        return (
          <View className="gap-3">
            {showDateHeader && (
              <View className="items-center my-1">
                <View className="bg-primary px-3 py-1 rounded-full">
                  <AppText size={12} color="onPrimary" variant="body-sm-medium">
                    {dateLabel}
                  </AppText>
                </View>
              </View>
            )}
            <ChatBubble
              message={item.message}
              state={getMessageState(item)}
              forGroup={isGroupChat}
              sender={{
                displayName: senderInfo?.displayName,
                avatarUrl: senderInfo?.avatarUrl,
              }}
              onFailedPress={
                item.local ? () => props.onFailedPress(item.local!) : undefined
              }
            />
          </View>
        );
      }}
    />
  );
}
