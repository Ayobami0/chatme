import {
  AppAvatar,
  AppLinearProgressIndicator,
  AppText,
  AppView,
  useRealtime,
} from "@components";
import { ConversationService } from "@services/conversation";
import { ChatBg1Svg } from "@shared/components/svgs/assets";
import {
  OutlineCheveronLeftSvg,
  OutlinePaperClipSvg,
  SolidPaperAirplaneSvg,
  SolidPhoneSvg,
  SolidVideoCameraSvg,
} from "@shared/components/svgs/icons";
import { AppColor } from "@shared/theme/color";
import { MessageModel } from "@shared/types/models";
import {
  formatActiveDateTimeHumanReadable,
  formatMessageDateSeparator,
} from "@shared/utils/datetime";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { Pressable, TextInput, View } from "react-native";
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

type ChatScreenProps = {
  conversationId: string;
  participantId: string;
  profileUrl?: string;
  fullName?: string;
  activeAt?: Date;
};

export default function ChatScreen(props: ChatScreenProps) {
  const { conversationId, participantId, profileUrl, fullName, activeAt } =
    props;
  const { socket, status } = useRealtime();
  const typingExpiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [otherPaticipantPresense, setOtherPaticipantPresense] = useState<
    "online" | "offline" | undefined
  >("offline");
  const [otherPaticipantTyping, setOtherPaticipantTyping] = useState(false);
  const { colorScheme } = useColorScheme();

  const loadMessagesForConversation = useCacheStore(
    (s) => s.loadMessagesForConversation,
  );
  const setCacheMessages = useCacheStore((s) => s.setMessages);
  const addOrUpdateMessage = useCacheStore((s) => s.addOrUpdateMessage);
  const cachedMessages = useCacheStore(
    (s) => s.messagesByConversation[conversationId],
  );

  const { data, isFetching } = useQuery({
    queryKey: ["conversationMessages", conversationId],
    queryFn: () => ConversationService.getConversationMessages(conversationId),
  });

  const { mutateAsync } = useMutation({
    mutationFn: async ({ text, id }: { text: string; id: string }) => {
      return await ConversationService.sendMessage(conversationId, {
        text,
        clientMessageId: id,
      });
    },
  });

  const { user } = useAuth();

  const [pendingMessages, setPendingMessages] = useState<
    Record<string, MessageModel>
  >({});
  const [failedMessages, setFailedMessages] = useState<
    Record<string, MessageModel>
  >({});

  useEffect(() => {
    void loadMessagesForConversation(conversationId);
    void ConversationService.markAllConversationMessagesAsRead(conversationId);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
  }, [conversationId, loadMessagesForConversation]);

  useEffect(() => {
    if (data?.items) {
      const reversedNetworkMessages = data.items.toReversed();
      setCacheMessages(conversationId, reversedNetworkMessages);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollToEnd({ animated: true }),
      );
    }
  }, [data, conversationId, setCacheMessages]);

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
  }, [status, socket, conversationId, participantId, addOrUpdateMessage, user?.id]);

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

  const sendMessage = (text: string) => {
    const id = Crypto.randomUUID();
    const message: MessageModel = {
      id,
      conversationId: conversationId,
      clientMessageId: id,
      senderId: user?.id ?? "user_1",
      kind: "text",
      text,
      createdAt: new Date().toISOString(),
    };

    setPendingMessages((m) => ({
      ...m,
      [id]: message,
    }));

    mutateAsync({ id, text })
      .then((d) => {
        setPendingMessages((m) => {
          const { [id]: _removed, ...rest } = m;
          return rest;
        });
        addOrUpdateMessage(conversationId, d);
      })
      .catch(() => {
        setPendingMessages((m) => {
          const { [id]: _removed, ...rest } = m;
          return rest;
        });
        setFailedMessages((m) => ({ ...m, [id]: message }));
      });
  };

  return (
    <AppView
      enabled
      className="p-0 relative"
      behavior="padding"
      style={{
        backgroundColor:
          colorScheme === "dark" ? AppColor.neutral900 : AppColor.primary50,
      }}
    >
      <ChatBg1Svg
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        color={colorScheme === "dark" ? AppColor.neutral700 : AppColor.white}
      />
      <ChatHeader
        fullName={fullName ?? ""}
        url={profileUrl}
        online={otherPaticipantPresense === "online"}
        date={activeAt}
      />
      {isFetching && <AppLinearProgressIndicator />}
      <ChatBody
        messages={messages}
        failedMessages={failedMessages}
        pendingMessages={pendingMessages}
        typing={otherPaticipantTyping}
        ref={scrollRef}
      />
      <ChatFooter
        colorScheme={colorScheme ?? "light"}
        onSend={sendMessage}
        onFocus={() => {}}
      />
    </AppView>
  );
}

function ChatHeader(props: {
  fullName: string;
  url?: string;
  online?: boolean;
  date?: Date;
}) {
  const presence = props.online ? "Online" : "Offline";
  return (
    <View className="bg-primary pt-safe pb-4 px-6">
      <View className="flex-row items-center pt-2">
        <Pressable onPress={router.back} className="mr-2">
          <OutlineCheveronLeftSvg
            width={24}
            height={24}
            color={AppColor.white}
          />
        </Pressable>
        {/* @ts-ignore */}
        <AppAvatar url={props.url} radius={48} isOnline={false} bordered />
        <View className="flex-1 mx-3">
          <AppText size={18} color="onPrimary" variant="h5">
            {props.fullName}
          </AppText>
          <AppText size={14} color="onPrimary" variant="body-md-regular">
            {formatActiveDateTimeHumanReadable(props.date) ?? presence}
          </AppText>
        </View>
        <View className="gap-5 flex-row">
          <Pressable>
            <SolidVideoCameraSvg color={AppColor.white} />
          </Pressable>
          <Pressable>
            <SolidPhoneSvg color={AppColor.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ChatBody(props: {
  messages: MessageModel[];
  failedMessages: Record<string, MessageModel>;
  pendingMessages: Record<string, MessageModel>;
  typing?: boolean;
  ref: React.RefObject<Animated.ScrollView | null>;
}) {
  const {
    messages,
    failedMessages,
    pendingMessages,
    typing = true,
    ref: scrollRef,
  } = props;

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

  const state = (id: string): MessageState => {
    return failedMessages[id]
      ? "error"
      : pendingMessages[id]
        ? "pending"
        : "success";
  };

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

          return (
            <View key={message.id} className="gap-3">
              {showDateHeader && (
                <View className="items-center my-2">
                  <View className="bg-muted px-3 py-1 rounded-full">
                    <AppText size={12} color="onPrimary" variant="body-sm-medium">
                      {currentDateLabel}
                    </AppText>
                  </View>
                </View>
              )}
              <ChatBubble message={message} state={state(message.id)} />
            </View>
          );
        })}
        {typing && <TypingChatBubble />}
      </Animated.ScrollView>
    </View>
  );
}

function ChatFooter(props: {
  colorScheme: "light" | "dark";
  onSend: (text: string) => void;
  onFocus?: () => void;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      style={{
        shadowColor: "#274431",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 24,
        elevation: 2,
      }}
      className="bg-background gap-3 py-4 px-3 flex-row items-center mx-6 mb-3 rounded-full"
    >
      <Pressable className="rounded-full size-10 items-center justify-center bg-surface">
        <OutlinePaperClipSvg
          width={24}
          height={24}
          color={
            props.colorScheme === "dark"
              ? AppColor.neutral100
              : AppColor.neutral300
          }
        />
      </Pressable>
      <TextInput
        onFocus={props.onFocus}
        ref={inputRef}
        className="flex-1"
        onChangeText={setText}
        placeholder="Start typing..."
      />
      <Pressable
        className="size-10 rounded-full bg-primary items-center justify-center"
        onPress={() => {
          if (text.trim()) {
            props.onSend(text);
            inputRef.current?.clear();
          }
        }}
      >
        <SolidPaperAirplaneSvg color={AppColor.white} />
      </Pressable>
    </View>
  );
}
