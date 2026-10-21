import {
  AppAvatar,
  AppLinearProgressIndicator,
  AppMediaAction,
  AppMediaUpload,
  AppText,
  AppView,
  toast,
} from "@components";
import { ChatBg1Svg } from "@shared/components/svgs/assets";
import {
  OutlineCheveronLeftSvg,
  OutlinePaperClipSvg,
  SolidPaperAirplaneSvg,
  SolidPhotographSvg,
  SolidUserGroupSvg,
  SolidXCircleSvg,
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
  Linking,
  Pressable,
  TextInput,
  View,
} from "react-native";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import {
  ChatBubble,
  MessageState,
  TypingChatBubble,
} from "../components/chat-bubble";
import { useAuth } from "@shared/context/auth-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppColor } from "@shared/theme/color";
import { useColorScheme } from "nativewind";
import { Image } from "expo-image";
import {
  PickedImage,
  prepareImageForUpload,
  UnsupportedMediaError,
} from "@shared/utils/media-file";
import { useConversationSync } from "../hooks/use-conversation-sync";
import { LocalMessage, useMessageSender } from "../hooks/use-message-sender";
import { usePresenceAndTyping } from "../hooks/use-presence-and-typing";
import { ParticipantReceipt, useReadReceipts } from "../hooks/use-read-receipts";
import { OutboxAttachment } from "../store/outbox";
import { useDraftsStore } from "../store/drafts";
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
        onLoadOlder={() => void sync.fetchOlder()}
        onFailedPress={onFailedPress}
      />
      <ChatFooter
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
      onEndReached={props.hasOlder ? props.onLoadOlder : undefined}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={typing ? <TypingChatBubble forGroup={isGroupChat} /> : null}
      ListFooterComponent={props.isFetchingOlder ? <ActivityIndicator className="py-2" /> : null}
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

function ChatFooter(props: {
  conversationId: string;
  onSend: (text: string, attachments: OutboxAttachment[]) => void;
  onTyping: () => void;
  onBlur: () => void;
}) {
  const { conversationId } = props;
  const text = useDraftsStore((s) => s.drafts[conversationId] ?? "");
  const setDraft = useDraftsStore((s) => s.setDraft);
  const clipIconColor = useThemeColor("subtext");
  const sendIconColor = useThemeColor("primary-foreground");
  const placeholderColor = useThemeColor("placeholder");
  const [showMediaSelection, setShowMediaSelection] = useState(false);
  const [attachments, setAttachments] = useState<OutboxAttachment[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const canSend = (text.trim().length > 0 || attachments.length > 0) && !isPreparing;

  const addImages = async (images: PickedImage[]) => {
    setShowMediaSelection(false);
    setIsPreparing(true);
    try {
      const prepared = await Promise.all(images.map(prepareImageForUpload));
      setAttachments((current) => [
        ...current,
        ...prepared.map((file) => ({
          type: "image" as const,
          localUri: file.uri,
          sizeBytes: file.sizeBytes,
          fileName: file.fileName,
          contentType: file.contentType,
          clientUploadId: Crypto.randomUUID(),
        })),
      ]);
    } catch (error) {
      toast.show({
        type: "error",
        text1: "Couldn't add photo",
        text2:
          error instanceof UnsupportedMediaError
            ? error.message
            : "This photo format isn't supported.",
      });
    } finally {
      setIsPreparing(false);
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Allow access to your photos in Settings to send pictures.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ],
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });
    if (!result.canceled) void addImages(result.assets);
  };

  const send = () => {
    if (!canSend) return;
    props.onSend(text.trim(), attachments);
    setDraft(conversationId, "");
    setAttachments([]);
  };

  return (
    <View className="gap-2">
      {attachments.length > 0 && (
        <FlatList
          horizontal
          contentContainerStyle={{ flexGrow: 1 }}
          showsHorizontalScrollIndicator={false}
          data={attachments}
          keyExtractor={(item) => item.localUri}
          ItemSeparatorComponent={() => <View className="w-2" />}
          renderItem={({ item, index }) => {
            return (
              <View
                className={`size-16 overflow-hidden rounded-lg ${index === 0 ? "ml-2" : ""} ${index === attachments.length - 1 ? "mr-2" : ""}`}
              >
                <AttachmentCard
                  attachment={item}
                  onRemove={() => {
                    setAttachments((a) => a.filter((other) => other !== item));
                  }}
                />
              </View>
            );
          }}
        />
      )}
      {showMediaSelection && (
        <View className="mx-6">
          {/* Documents are hidden until non-image attachments are supported end to end. */}
          <AppMediaUpload
            showRecentImage
            onRecentImagePicked={(uri, data) => {
              if (uri) void addImages([{ uri, fileName: data?.filename }]);
            }}
          >
            <AppMediaAction
              icon={SolidPhotographSvg}
              label="Photo or Gallery"
              onPress={() => void pickFromLibrary()}
            />
          </AppMediaUpload>
        </View>
      )}
      <View
        style={{
          shadowColor: "#274431",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.02,
          shadowRadius: 24,
          elevation: 2,
        }}
        className="bg-background gap-3 py-4 px-3 flex-row items-center mx-6 mb-5 rounded-full"
      >
        <Pressable
          onPress={() => {
            setShowMediaSelection(!showMediaSelection);
          }}
          className="rounded-full size-10 items-center justify-center bg-surface"
          accessibilityRole="button"
          accessibilityLabel="Add attachment"
          accessibilityState={{ expanded: showMediaSelection }}
        >
          {isPreparing ? (
            <ActivityIndicator />
          ) : (
            <OutlinePaperClipSvg width={24} height={24} color={clipIconColor} />
          )}
        </Pressable>
        <TextInput
          className="flex-1 text-title"
          value={text}
          onChangeText={(value) => {
            setDraft(conversationId, value);
            if (value) props.onTyping();
            else props.onBlur();
          }}
          onBlur={props.onBlur}
          accessibilityLabel="Message"
          placeholder="Start typing..."
          placeholderTextColor={placeholderColor}
        />
        <Pressable
          className={`size-10 rounded-full bg-primary items-center justify-center ${canSend ? "" : "opacity-50"}`}
          disabled={!canSend}
          onPress={send}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
        >
          <SolidPaperAirplaneSvg color={sendIconColor} />
        </Pressable>
      </View>
    </View>
  );
}

const AttachmentCard = ({
  attachment,
  onRemove,
}: {
  attachment: OutboxAttachment;
  onRemove: () => void;
}) => {
  return (
    <View className="relative size-16 overflow-visible">
      <Pressable
        onPress={onRemove}
        style={{ position: "absolute", top: -5, right: -5, zIndex: 1 }}
        accessibilityRole="button"
        accessibilityLabel="Remove attachment"
        hitSlop={8}
      >
        <SolidXCircleSvg color={AppColor.danger} />
      </Pressable>

      <View className="size-full overflow-hidden rounded-lg">
        <Image
          source={{ uri: attachment.localUri }}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    </View>
  );
};
