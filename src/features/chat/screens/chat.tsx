import {
  AppAvatar,
  AppLinearProgressIndicator,
  AppMediaAction,
  AppMediaUpload,
  AppText,
  AppView,
  useRealtime,
} from "@components";
import { ChatBg1Svg } from "@shared/components/svgs/assets";
import {
  OutlineCheveronLeftSvg,
  OutlinePaperClipSvg,
  SolidDocumentTextSvg,
  SolidLocationMarkerSvg,
  SolidPaperAirplaneSvg,
  SolidPhoneSvg,
  SolidPhotographSvg,
  SolidUserCircleSvg,
  SolidUserGroupSvg,
  SolidVideoCameraSvg,
  SolidXCircleSvg,
} from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import {
  ConversationModel,
  DocumentMessageAttachmentModel,
  GroupConversationModel,
  GroupConversationParticipant,
  ImageMessageAttachmentModel,
  MessageAttachmentModel,
  MessageKind,
  MessageModel,
  VideoMessageAttachmentModel,
} from "@shared/types/models";
import {
  formatActiveDateTimeHumanReadable,
  formatMessageDateSeparator,
} from "@shared/utils/datetime";
import {
  useConversationMessages,
  useConversationDetails,
  useSendMessage,
  useMarkAllAsRead,
  useConversationReceipts,
} from "../query";
import { router } from "expo-router";
import { FlatList, Pressable, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import {
  ChatBubble,
  MessageState,
  TypingChatBubble,
} from "../components/chat-bubble";
import { useAuth } from "@shared/context/auth-context";
import { useCacheStore } from "@shared/store/cache";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Crypto from "expo-crypto";
import {
  PresenceChangedEventPayload,
  PresenceSubscriptionData,
  RealtimeAck,
  ReceiptUpdatedEventPayload,
  TypingStartedEventPayload,
  TypingStoppedEventPayload,
} from "@shared/types/realtime";
import { AppColor } from "@shared/theme/color";
import { colorScheme, useColorScheme } from "nativewind";
import { MediaType } from "@shared/types/api";
import { Image } from "expo-image";
import { useUpload } from "@shared/hooks";
import {
  AllowedContentType,
  getContentTypeFromAsset,
} from "@shared/utils/file-types";

type ChatScreenProps = {
  conversationId: string;
  participantId: string;
  profileUrl?: string;
  fullName?: string;
  activeAt?: Date;
  isGroup: boolean;
};

export default function ChatScreen(props: ChatScreenProps) {
  const { conversationId, participantId, profileUrl, fullName, activeAt } =
    props;
  const { socket, status } = useRealtime();
  const typingExpiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const { colorScheme } = useColorScheme();
  const [otherPaticipantPresense, setOtherPaticipantPresense] = useState<
    "online" | "offline" | undefined
  >("offline");
  const [otherPaticipantTyping, setOtherPaticipantTyping] = useState(false);
  const bgSvgColor = useThemeColor("muted");

  const loadMessagesForConversation = useCacheStore(
    (s) => s.loadMessagesForConversation,
  );
  const setCacheMessages = useCacheStore((s) => s.setMessages);
  const addOrUpdateMessage = useCacheStore((s) => s.addOrUpdateMessage);
  const cachedMessages = useCacheStore(
    (s) => s.messagesByConversation[conversationId],
  );

  const { data, isFetching } = useConversationMessages(conversationId);
  const conversationQuery = useConversationDetails(conversationId);
  const { data: conversation, refetch: refetchConversation } =
    conversationQuery;

  const sendMessageMutation = useSendMessage(conversationId);
  const mutateAsync = sendMessageMutation.mutateAsync;

  const { user } = useAuth();

  const [pendingMessages, setPendingMessages] = useState<
    Record<string, MessageModel>
  >({});
  const [failedMessages, setFailedMessages] = useState<
    Record<string, MessageModel>
  >({});

  const markAllAsReadMutation = useMarkAllAsRead();
  const markAllAsRead = markAllAsReadMutation.mutate;

  const { upload } = useUpload({
    purpose: "message_attachment",
  });

  useEffect(() => {
    void loadMessagesForConversation(conversationId);
    markAllAsRead(conversationId);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
  }, [conversationId, loadMessagesForConversation, markAllAsRead]);

  useEffect(() => {
    if (data) {
      setCacheMessages(conversationId, data);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true }),
      );
    }
  }, [data, conversationId, setCacheMessages]);

  const [receiptsList, setReceiptsList] = useState<
    Array<{
      userId: string;
      version?: number;
      delivered?: { messageId: string; at: string } | null;
      read?: { messageId: string; at: string } | null;
    }>
  >([]);

  const { data: receiptData } = useConversationReceipts(conversationId);

  useEffect(() => {
    if (receiptData?.items) {
      setReceiptsList(receiptData.items);
    }
  }, [receiptData]);

  useEffect(() => {
    if (!socket || status !== "connected") return;
    let active = true;

    const subscribe = () => {
      socket.emit(
        "presence.subscribe",
        { conversationId },
        (response: RealtimeAck<PresenceSubscriptionData>) => {
          if (!active || !response.ok) return;

          const participant = response.data.participants.find(
            (item) => item.userId === participantId,
          );
          setOtherPaticipantPresense(participant?.status);
          const typing = response.data.typing.find(
            (item) => item.userId === participantId,
          );
          if (typing) showOtherTypingUntil(typing.expiresAt);
          else setOtherPaticipantTyping(false);
        },
      );
    };

    const onMessage = (message: MessageModel) => {
      if (message.conversationId !== conversationId) return;
      if (message.senderId === user?.id) return;
      addOrUpdateMessage(conversationId, message);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true }),
      );
    };
    const onReceipt = (event: ReceiptUpdatedEventPayload) => {
      if (event.conversationId !== conversationId) return;
      setReceiptsList((prev) => {
        const idx = prev.findIndex((item) => item.userId === event.userId);
        const updated = {
          userId: event.userId,
          version: event.version,
          delivered: event.delivered,
          read: event.read,
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
    };
    const onPresence = (event: PresenceChangedEventPayload) => {
      if (
        event.conversationId === conversationId &&
        event.userId === participantId
      ) {
        setOtherPaticipantPresense(event.status);
      }
    };
    const onTypingStarted = (event: TypingStartedEventPayload) => {
      if (
        event.conversationId === conversationId &&
        event.userId === participantId
      ) {
        showOtherTypingUntil(event.expiresAt);
      }
    };
    const onTypingStopped = (event: TypingStoppedEventPayload) => {
      if (
        event.conversationId === conversationId &&
        event.userId === participantId
      ) {
        if (typingExpiryRef.current) clearTimeout(typingExpiryRef.current);
        typingExpiryRef.current = null;
        setOtherPaticipantTyping(false);
      }
    };
    const onDisconnect = () => {
      if (typingExpiryRef.current) clearTimeout(typingExpiryRef.current);
      typingExpiryRef.current = null;
      setOtherPaticipantPresense("offline");
      setOtherPaticipantTyping(false);
    };

    socket.on("connect", subscribe);
    socket.on("message.created", onMessage);
    socket.on("receipt.delivered", onReceipt);
    socket.on("receipt.read", onReceipt);
    socket.on("presence.changed", onPresence);
    socket.on("typing.started", onTypingStarted);
    socket.on("typing.stopped", onTypingStopped);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) subscribe();

    return () => {
      active = false;
      socket.off("connect", subscribe);
      socket.off("message.created", onMessage);
      socket.off("receipt.delivered", onReceipt);
      socket.off("receipt.read", onReceipt);
      socket.off("presence.changed", onPresence);
      socket.off("typing.started", onTypingStarted);
      socket.off("typing.stopped", onTypingStopped);
      socket.off("disconnect", onDisconnect);
      if (socket.connected) {
        socket.emit(
          "presence.unsubscribe",
          { conversationId },
          () => undefined,
        );
      }
    };
  }, [
    status,
    socket,
    conversationId,
    participantId,
    addOrUpdateMessage,
    user?.id,
  ]);

  const messages = cachedMessages ?? [];

  const showOtherTypingUntil = useCallback((expiresAt: string) => {
    if (typingExpiryRef.current) clearTimeout(typingExpiryRef.current);
    const delay = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    setOtherPaticipantTyping(delay > 0);
    typingExpiryRef.current = setTimeout(() => {
      setOtherPaticipantTyping(false);
      typingExpiryRef.current = null;
    }, delay);
  }, []);

  const sendMessage = async (
    text: string,
    kind?: MessageKind,
    attachments?: Attachment[],
  ) => {
    const id = Crypto.randomUUID();

    let convertedAttachments: MessageAttachmentModel[] | undefined;
    if (attachments && attachments.length > 0) {
      // @ts-ignore
      convertedAttachments = attachments.map((a) => ({
        url: a.attachmentUrl,
        mediaId: "",
        type: a.type,
        sizeBytes: a.sizeBytes,
        filename: a.fileName,
        contentType: a.contentType,
      }));
    }
    const message: MessageModel = {
      id,
      conversationId: conversationId,
      clientMessageId: id,
      senderId: user?.id ?? "user_1",
      kind: kind ?? "text",
      text,
      attachments: convertedAttachments,
      createdAt: new Date().toISOString(),
    };

    setPendingMessages((m) => ({
      ...m,
      [id]: message,
    }));
    try {
      const data = await Promise.all(
        convertedAttachments?.map((e) =>
          upload({ uri: e.url, contentType: e.contentType }),
        ) ?? [],
      );

      const ids = data?.map((d) => d?.id);

      const d = await mutateAsync({
        text,
        id,
        attachmentMediaIds: kind !== "text" ? ids : undefined,
      });
      setPendingMessages((m) => {
        const { [id]: _removed, ...rest } = m;
        return rest;
      });
      addOrUpdateMessage(conversationId, d);
    } catch (e) {
      setPendingMessages((m) => {
        const { [id]: _removed, ...rest } = m;
        return rest;
      });
      setFailedMessages((m) => ({ ...m, [id]: message }));
    }
  };

  const chatBg =
    colorScheme === "dark" ? AppColor.neutral700 : AppColor.primary50;

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
        fullName={fullName ?? ""}
        url={profileUrl}
        online={otherPaticipantPresense === "online"}
        conversation={conversation ?? undefined}
        date={activeAt}
      />
      {isFetching && <AppLinearProgressIndicator />}
      <ChatBody
        messages={messages}
        failedMessages={failedMessages}
        pendingMessages={pendingMessages}
        receiptsList={receiptsList}
        typing={otherPaticipantTyping}
        ref={scrollRef}
        conversation={conversation ?? undefined}
      />
      <ChatFooter onSend={sendMessage} onFocus={() => {}} />
    </AppView>
  );
}

function ChatHeader(props: {
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

  return (
    <View className="bg-primary pt-safe pb-4 px-6">
      <Pressable
        className="flex-row items-center pt-2"
        onPress={() => {
          return router.push(`/chat/${props.conversation?.id}/chat-info`);
        }}
      >
        <Pressable onPress={router.back} className="mr-2">
          <OutlineCheveronLeftSvg width={24} height={24} color={iconColor} />
        </Pressable>
        {/* @ts-ignore */}
        <AppAvatar
          url={props.url}
          name={props.fullName}
          size={48}
          isOnline={false}
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
            {props.conversation?.type === "group"
              ? formatParticipants(props.conversation.participants)
              : (formatActiveDateTimeHumanReadable(props.date) ?? presence)}
          </AppText>
        </View>
        <View className="gap-5 flex-row">
          <Pressable>
            <SolidVideoCameraSvg color={iconColor} />
          </Pressable>
          <Pressable>
            <SolidPhoneSvg color={iconColor} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

function ChatBody(props: {
  messages: MessageModel[];
  failedMessages: Record<string, MessageModel>;
  pendingMessages: Record<string, MessageModel>;
  receiptsList: Array<{
    userId: string;
    version?: number;
    delivered?: { messageId: string; at: string } | null;
    read?: { messageId: string; at: string } | null;
  }>;
  typing?: boolean;
  conversation?: ConversationModel | GroupConversationModel;
  ref: React.RefObject<Animated.ScrollView | null>;
}) {
  const {
    messages,
    failedMessages,
    pendingMessages,
    receiptsList,
    typing = true,
    ref: scrollRef,
    conversation,
  } = props;
  const { user } = useAuth();

  const combinedMessages = [
    ...messages,
    ...Object.values(failedMessages),
    ...Object.values(pendingMessages),
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd();
    }
  }, [combinedMessages]);

  const getMessageState = (
    message: MessageModel,
    index: number,
  ): MessageState => {
    if (failedMessages[message.id]) return "error";
    if (pendingMessages[message.id]) return "pending";

    const isMine = message.senderId === user?.id;
    if (!isMine) return "sent";

    const isRead = receiptsList.some((receipt) => {
      if (receipt.userId === user?.id || !receipt.read?.messageId) return false;
      if (receipt.read.messageId === message.id) return true;
      const readIdx = combinedMessages.findIndex(
        (m) => m.id === receipt.read?.messageId,
      );
      return readIdx >= 0 && index <= readIdx;
    });
    if (isRead) return "read";

    const isDelivered = receiptsList.some((receipt) => {
      if (receipt.userId === user?.id || !receipt.delivered?.messageId)
        return false;
      if (receipt.delivered.messageId === message.id) return true;
      const deliveredIdx = combinedMessages.findIndex(
        (m) => m.id === receipt.delivered?.messageId,
      );
      return deliveredIdx >= 0 && index <= deliveredIdx;
    });
    if (isDelivered) return "delivered";

    return "sent";
  };

  const isGroupChat = conversation?.type === "group";
  const groupParticipants =
    conversation?.type === "group"
      ? (conversation as GroupConversationModel).participants
      : [];

  const participantsMap = useMemo(() => {
    const map = new Map<
      string,
      { displayName?: string | null; avatarUrl?: string | null }
    >();
    if (groupParticipants) {
      for (const p of groupParticipants) {
        map.set(p.id, { displayName: p.displayName, avatarUrl: p.avatarUrl });
      }
    }
    return map;
  }, [groupParticipants]);

  if (combinedMessages.length === 0 && !typing) {
    return (
      <View className="flex-1 items-center justify-center">
        <AppText variant="body-md-medium" color="subtext">
          No messages yet
        </AppText>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerClassName="gap-3 py-4"
        showsVerticalScrollIndicator={false}
      >
        {combinedMessages.map((message, index) => {
          const participant = groupParticipants.find(
            (p) => p.id === message.senderId,
          );
          const profileUrl = participant?.avatarUrl;
          const fullName = participant?.displayName;

          const currentDateLabel = formatMessageDateSeparator(
            message.createdAt,
          );
          const prevDateLabel =
            index > 0
              ? formatMessageDateSeparator(
                  combinedMessages[index - 1].createdAt,
                )
              : null;

          const showDateHeader = currentDateLabel !== prevDateLabel;
          const senderInfo = participantsMap.get(message.senderId);

          return (
            <View key={message.id} className="gap-3">
              {showDateHeader && (
                <View className="items-center my-1">
                  <View className="bg-primary px-3 py-1 rounded-full">
                    <AppText
                      size={12}
                      color="onPrimary"
                      variant="body-sm-medium"
                    >
                      {currentDateLabel}
                    </AppText>
                  </View>
                </View>
              )}
              <ChatBubble
                message={message}
                state={getMessageState(message, index)}
                forGroup={isGroupChat}
                sender={{
                  displayName:
                    senderInfo?.displayName ??
                    (message.senderId === participant?.id
                      ? fullName
                      : undefined),
                  avatarUrl:
                    senderInfo?.avatarUrl ??
                    (message.senderId === participant?.id
                      ? profileUrl
                      : undefined),
                }}
              />
            </View>
          );
        })}
        {typing && <TypingChatBubble forGroup={isGroupChat} />}
      </Animated.ScrollView>
    </View>
  );
}

function ChatFooter(props: {
  onSend: (
    text: string,
    kind?: MessageKind,
    attachments?: Attachment[],
  ) => void;
  onFocus?: () => void;
}) {
  const [text, setText] = useState("");
  const clipIconColor = useThemeColor("subtext");
  const sendIconColor = useThemeColor("primary-foreground");
  const placeholderColor = useThemeColor("placeholder");
  const [showMediaSelection, setShowMediaSelection] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const canSend = text.trim().length > 0 || attachments.length > 0;

  const send = () => {
    if (!canSend) return;
    props.onSend(
      text.trim(),
      attachments.length > 0 ? "image" : "text",
      attachments,
    );
    setText("");
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
          keyExtractor={(_, i) => i.toString()}
          ItemSeparatorComponent={() => <View className="w-2" />}
          renderItem={({ item, index }) => {
            return (
              <View
                className={`size-16 overflow-hidden rounded-lg ${index === 0 ? "ml-2" : ""} ${index === attachments.length - 1 ? "mr-2" : ""}`}
              >
                <AttachmentCard
                  attachment={item}
                  onRemove={() => {
                    setAttachments((a) => a.filter((item2) => item2 !== item));
                  }}
                />
              </View>
            );
          }}
        />
      )}
      {showMediaSelection && (
        <View className="mx-6">
          <AppMediaUpload
            showRecentImage
            onRecentImagePicked={(uri, data) => {
              if (uri) {
                setAttachments((a) => [
                  ...a,
                  {
                    type: "image",
                    attachmentUrl: uri,
                    sizeBytes: 0,
                    fileName: data?.filename ?? "",
                    contentType: getContentTypeFromAsset({ uri }),
                  },
                ]);
                setShowMediaSelection(false);
              }
            }}
          >
            <AppMediaAction
              icon={SolidPhotographSvg}
              label={"Photo or Gallery"}
              onPress={function (): void {}}
            />
            <AppMediaAction
              icon={SolidDocumentTextSvg}
              label={"Document"}
              onPress={function (): void {}}
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
          <OutlinePaperClipSvg width={24} height={24} color={clipIconColor} />
        </Pressable>
        <TextInput
          onFocus={props.onFocus}
          className="flex-1 text-title"
          value={text}
          onChangeText={setText}
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
  attachment: Attachment;
  onRemove: () => void;
}) => {
  return (
    <View className="relative size-16 overflow-visible">
      <SolidXCircleSvg
        style={{ position: "absolute", top: -5, right: -5, zIndex: 1 }}
        color={AppColor.danger}
        onPress={() => {
          onRemove();
        }}
      />

      <View className="size-full overflow-hidden rounded-lg">
        <Image
          source={{ uri: attachment.attachmentUrl }}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    </View>
  );
};

type Attachment = {
  type: "audio" | "image" | "video" | "document";
  attachmentUrl: string;
  sizeBytes: number;
  fileName: string;
  contentType: AllowedContentType | undefined;
};
