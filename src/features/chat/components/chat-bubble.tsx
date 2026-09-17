import { AppText } from "@components";
import { AppAvatar } from "@shared/components/app-avatar";
import {
  OutlineCheckSvg,
  OutlineClockSvg,
  OutlineDoubleCheckSvg,
  OutlineExclamationCircleSvg,
} from "@shared/components/svgs/icons";
import { useAuth } from "@shared/context/auth-context";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { MessageModel } from "@shared/types/models";
import { formatMessageTime } from "@shared/utils/datetime";
import { View } from "react-native";

export type MessageState =
  | "pending"
  | "sent"
  | "success"
  | "delivered"
  | "read"
  | "viewed"
  | "error";

type ChatBubbleProps = {
  message: MessageModel;
  state: MessageState;
  forGroup?: boolean;
  sender?: {
    displayName?: string | null;
    avatarUrl?: string | null;
  };
};

export function ChatBubble(props: ChatBubbleProps) {
  const {
    message,
    state,
    forGroup = false,
    sender,
  } = props;
  const formatedDate = formatMessageTime(new Date(message.createdAt));
  const { user } = useAuth();
  const isMine = message.senderId === user?.id;
  const subtextColor = useThemeColor("subtext");
  const primaryColor = useThemeColor("primary");
  const dangerColor = useThemeColor("danger");

  const effectiveSenderName = sender?.displayName;
  const effectiveSenderAvatarUrl = sender?.avatarUrl;
  const showGroupSender = forGroup && !isMine;

  const StateIcon = () => {
    switch (state) {
      case "pending":
        return (
          <OutlineClockSvg width={16} height={16} color={subtextColor} />
        );
      case "sent":
      case "success":
        return (
          <OutlineCheckSvg width={16} height={16} color={subtextColor} />
        );
      case "delivered":
        return (
          <OutlineDoubleCheckSvg width={16} height={16} color={subtextColor} />
        );
      case "read":
      case "viewed":
        return (
          <OutlineDoubleCheckSvg width={16} height={16} color={primaryColor} />
        );
      case "error":
        return (
          <OutlineExclamationCircleSvg
            width={16}
            height={16}
            color={dangerColor}
          />
        );
    }
  };

  return (
    <View
      className={`flex-row items-end mx-6 gap-2.5 ${isMine ? "justify-end" : "justify-start"}`}
    >
      {showGroupSender && (
        <AppAvatar
          url={effectiveSenderAvatarUrl}
          radius={32}
          isOnline={false}
        />
      )}
      <View className="max-w-[70%]">
        <View
          style={{
            shadowColor: "#183421",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.01,
            shadowRadius: 8,
            elevation: 3,
          }}
          className={`rounded-2xl ${isMine ? "bg-primary rounded-br-none" : "bg-secondary rounded-bl-none"} py-3 px-4`}
        >
          {showGroupSender && effectiveSenderName && (
            <AppText
              variant="body-sm-semibold"
              color="primary"
              className="mb-1"
            >
              {effectiveSenderName}
            </AppText>
          )}
          <AppText
            color={isMine ? "onPrimary" : "body"}
            variant="body-md-medium"
          >
            {message.text}
          </AppText>
        </View>
        <View
          className={`flex-row flex-1 items-center ${isMine ? "justify-end" : "justify-start pl-1"}`}
        >
          <AppText variant="body-md-medium" color="caption" size={12}>
            {formatedDate}
          </AppText>
          {isMine && <StateIcon />}
        </View>
      </View>
    </View>
  );
}

export function TypingChatBubble(props?: {
  forGroup?: boolean;
  senderAvatarUrl?: string | null;
}) {
  const { forGroup = false, senderAvatarUrl } = props ?? {};
  return (
    <View className="flex-row items-end mx-6 gap-2.5 justify-start">
      {forGroup && (
        <AppAvatar
          url={senderAvatarUrl}
          radius={32}
          isOnline={false}
        />
      )}
      <View
        style={{
          shadowColor: "#183421",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.01,
          shadowRadius: 8,
          elevation: 3,
        }}
        className={`rounded-xl bg-secondary rounded-bl-none py-3 px-4`}
      >
        <View className="flex-row items-center gap-2">
          <View className="size-2 bg-body rounded-full animate-pulse"></View>
          <View className="size-2 bg-body rounded-full animate-pulse"></View>
          <View className="size-2 bg-body rounded-full animate-pulse"></View>
        </View>
      </View>
    </View>
  );
}
