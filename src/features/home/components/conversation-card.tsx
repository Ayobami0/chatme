import { AppAvatar, AppText } from "@components";
import { ConversationModel } from "@shared/types/models";
import { Pressable, TouchableOpacity, View } from "react-native";
import { formatDateTime } from "@shared/utils/datetime";
import { router } from "expo-router";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { AppColor } from "@shared/theme/color";
import { FC, useState } from "react";
import { SvgProps } from "react-native-svg";
import {
  OutlineArchiveSvg,
  OutlineDotsHorizontalSvg,
  SolidBellSvg,
  SolidBookmarkSvg,
  SolidTrashSvg,
  SolidVolumeOff1Svg,
} from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";

type ConversationCardProps = {
  conversation: ConversationModel;
  onMute: () => void;
  onPin: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onMore: () => void;
};

const ACTION_WIDTH = 72;

export function ConversationCard(props: ConversationCardProps) {
  const { conversation, onMute, onPin, onDelete, onArchive, onMore } = props;
  const bgColor = useThemeColor("background");
  const mutedColor = useThemeColor("muted");

  const [bg, setBg] = useState<string>(bgColor);

  const navigateToChat = () => {
    router.push({
      // @ts-ignore
      pathname: `/chat/${conversation.id}`,
      params: {
        activeAt: conversation.lastActivityAt ?? "",
        participantId: conversation.otherParticipant.id,
        displayName: encodeURIComponent(
          conversation.otherParticipant.displayName,
        ),
        profileUrl: encodeURIComponent(conversation.otherParticipant.avatarUrl),
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
            label="Mute"
            onPress={onMute}
            icon={SolidVolumeOff1Svg}
            color={AppColor.warning}
          />

          <SwipeAction
            color={AppColor.neutral100}
            label="Pin"
            onPress={onPin}
            icon={SolidBookmarkSvg}
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
            label="Archive"
            onPress={onArchive}
            icon={OutlineArchiveSvg}
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
        onPress={navigateToChat}
        style={{ backgroundColor: bg }}
        className="flex-row items-center gap-4 px-3 h-20 transition-colors"
      >
        <AppAvatar url={conversation.otherParticipant.avatarUrl} />

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <AppText variant="body-lg-semibold">
              {conversation.otherParticipant.displayName}
            </AppText>

            <AppText
              variant="body-md-regular"
              color={conversation.unreadCount > 0 ? "primary" : "muted"}
            >
              {conversation.latestMessage?.createdAt &&
                formatDateTime(conversation.latestMessage.createdAt)}
            </AppText>
          </View>

          <View className="flex-row items-center justify-between">
            <AppText
              variant="body-lg-regular"
              color="muted"
              numberOfLines={1}
              className="mr-2 flex-1"
            >
              {conversation.latestMessage?.preview}
            </AppText>

            {conversation.unreadCount > 0 && (
              <View className="size-6 items-center justify-center rounded-full bg-primary-400">
                <AppText color="onPrimary">{conversation.unreadCount}</AppText>
              </View>
            )}
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
