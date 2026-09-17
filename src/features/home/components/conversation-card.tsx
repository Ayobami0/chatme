import { AppAvatar, AppText, useRealtime } from "@components";
import { ConversationModel } from "@shared/types/models";
import { Pressable, TouchableOpacity, View } from "react-native";
import { diffInSeconds, formatDateTime } from "@shared/utils/datetime";
import { router } from "expo-router";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { AppColor } from "@shared/theme/color";
import { FC, useEffect, useState } from "react";
import { SvgProps } from "react-native-svg";
import {
  OutlineArchiveSvg,
  OutlineDotsHorizontalSvg,
  OutlinePushPinSvg,
  SolidArchiveSvg,
  SolidBellSvg,
  SolidPushPinSvg,
  SolidTrashSvg,
  SolidUserGroupSvg,
  SolidVolumeOff1Svg,
  SolidVolumeUp1Svg,
} from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { PresenceChangedEventPayload } from "@shared/types/realtime";

import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";

type ConversationCardProps = {
  conversation: ConversationModel;
  onMute: () => void;
  onPin: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onMore: () => void;
  onLongPress?: () => void;
  onPress?: () => void;
  isSelected?: boolean;
};

const ACTION_WIDTH = 72;

export function ConversationCard(props: ConversationCardProps) {
  const {
    conversation,
    onMute,
    onPin,
    onDelete,
    onArchive,
    onMore,
    onLongPress,
    onPress,
    isSelected = false,
  } = props;
  const { colorScheme } = useColorScheme();
  const bgColor = useThemeColor("background");
  const subtextColor = useThemeColor("subtext");
  const mutedColor =
    colorScheme === "dark" ? AppColor.neutral700 : AppColor.primary50;
  const [isOnline, setIsOnline] = useState(
    conversation.lastActivityAt === undefined
      ? false
      : diffInSeconds(new Date(), new Date(conversation.lastActivityAt)) < 30, // 30s time limit for presense detection
  );

  const [bg, setBg] = useState<string>(bgColor);
  const { socket, status } = useRealtime();

  const isDirect = conversation.type === "direct";
  const otherParticipant = isDirect ? conversation.otherParticipant : null;
  const displayName = isDirect
    ? (conversation.otherParticipant.displayName ?? "")
    : conversation.name;
  const avatarUrl = isDirect
    ? (conversation.otherParticipant.avatarUrl ?? undefined)
    : (conversation.avatarUrl ?? undefined);

  const isMuted = conversation.settings?.muted ?? false;
  const isPinned = conversation.settings?.pinned ?? false;
  const isArchived = conversation.settings?.archived ?? false;
  const isGroup = conversation.type === "group";

  useEffect(() => {
    if (!socket || status !== "connected" || !isDirect || !otherParticipant)
      return;
    const onPresenceChanged = (event: PresenceChangedEventPayload) => {
      if (
        event.conversationId === conversation.id &&
        event.userId === otherParticipant.id
      ) {
        setIsOnline(event.status === "online");
      }
    };

    socket.on("presence.changed", onPresenceChanged);

    return () => {
      socket.off("presence.changed", onPresenceChanged);
    };
  }, [socket, status, isDirect, otherParticipant, conversation.id]);

  const navigateToChat = () => {
    router.push({
      // @ts-ignore
      pathname: `/chat/${conversation.id}`,
      params: {
        isGroup: String(conversation.type === 'group'),
        activeAt: conversation.lastActivityAt ?? "",
        participantId: isDirect ? conversation.otherParticipant.id : "",
        displayName: encodeURIComponent(displayName),
        profileUrl: encodeURIComponent(avatarUrl ?? ""),
      },
    });
  };

  return (
    <ReanimatedSwipeable
      friction={2}
      onSwipeableWillClose={() => {
        setBg(bgColor);
      }}
      onSwipeableWillOpen={() => {
        setBg(mutedColor);
      }}
      renderLeftActions={() => (
        <View className="flex-row gap-2 mr-2">
          <SwipeAction
            label={isMuted ? "Unmute" : "Mute"}
            onPress={onMute}
            icon={isMuted ? SolidVolumeUp1Svg : SolidVolumeOff1Svg}
            color={AppColor.warning}
          />

          <SwipeAction
            color={AppColor.neutral100}
            label={isPinned ? "Unpin" : "Pin"}
            onPress={onPin}
            icon={isPinned ? OutlinePushPinSvg : SolidPushPinSvg}
          />
        </View>
      )}
      renderRightActions={() => (
        <View className="flex-row gap-2 ml-2">
          <SwipeAction
            color={AppColor.danger}
            label="Delete"
            onPress={onDelete}
            icon={SolidTrashSvg}
          />

          <SwipeAction
            color={AppColor.neutral100}
            label={isArchived ? "Unarchive" : "Archive"}
            onPress={onArchive}
            icon={isArchived ? OutlineArchiveSvg : SolidArchiveSvg}
          />

          <SwipeAction
            label="More"
            color={AppColor.neutral50}
            onPress={onMore}
            icon={OutlineDotsHorizontalSvg}
          />
        </View>
      )}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (onPress) {
            onPress();
          } else {
            navigateToChat();
          }
        }}
        onLongPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onLongPress?.();
        }}
        style={{ backgroundColor: isSelected ? mutedColor : bg }}
        className={`flex-row items-center gap-4 px-3 h-20 transition-colors rounded-xl`}
      >
        <AppAvatar url={avatarUrl} name={displayName} isOnline={isOnline} />

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 flex-1 mr-2">
              {isGroup && (
                <SolidUserGroupSvg
                  color={AppColor.primary400}
                  width={20}
                  height={20}
                />
              )}
              <AppText variant="body-lg-semibold" numberOfLines={1}>
                {displayName}
              </AppText>
              {isMuted && (
                <SolidVolumeOff1Svg
                  width={20}
                  height={20}
                  color={subtextColor}
                />
              )}
            </View>

            <AppText
              variant="body-md-regular"
              color={conversation.unreadCount > 0 ? "primary" : "muted"}
            >
              {conversation.latestMessage?.createdAt &&
                formatDateTime(conversation.latestMessage.createdAt)}
            </AppText>
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <AppText
              variant="body-lg-regular"
              color="muted"
              numberOfLines={1}
              className="mr-2 flex-1"
            >
              {conversation.latestMessage?.preview}
            </AppText>

            <View className="flex-row items-center gap-2">
              {isPinned && (
                <SolidPushPinSvg width={20} height={20} color={subtextColor} />
              )}
              {conversation.unreadCount > 0 && (
                <View className="size-6 items-center justify-center rounded-full bg-primary-400">
                  <AppText color="onPrimary">
                    {conversation.unreadCount}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}

type SwipeActionProps = {
  color?: string;
  onPress?: () => void;
  icon: FC<SvgProps>;
  label: string;
};

function SwipeAction({ color, onPress, icon, label }: SwipeActionProps) {
  const Icon = icon;
  return (
    <Pressable
      className="h-full items-center justify-center rounded-lg"
      style={{
        width: ACTION_WIDTH,
        backgroundColor: color,
      }}
      onPress={onPress}
    >
      <Icon width={20} height={20} color={AppColor.white} />

      <AppText size={12} variant="body-md-medium" color="onPrimary">
        {label}
      </AppText>
    </Pressable>
  );
}
