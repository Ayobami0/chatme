import { AppAvatar, AppText } from "@components";
import { ConversationModel } from "@shared/types/models";
import { TouchableOpacity, View } from "react-native";
import { formatDateTime } from "@shared/utils/datetime";
import { router } from "expo-router";

type ConversationCardProps = {
  conversation: ConversationModel;
};

export function ConversationCard(props: ConversationCardProps) {
  const { conversation } = props;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          // @ts-ignore
          pathname: `/chat/${conversation.id}`,
          params: {
            activeAt: conversation.lastActivityAt ?? "",
            participantId: conversation.otherParticipant.id,
            displayName: encodeURIComponent(
              conversation.otherParticipant.displayName,
            ),
            profileUrl: encodeURIComponent(
              conversation.otherParticipant.avatarUrl,
            ),
          },
        })
      }
      className="gap-4 flex-row items-center px-3 py-[14]"
    >
      <AppAvatar url={conversation.otherParticipant.avatarUrl} />
      <View className="flex-1 gap-0">
        <View className="flex-row items-center justify-between">
          <AppText variant="body-lg-semibold">
            {conversation.otherParticipant.displayName}
          </AppText>
          <AppText
            variant="body-md-regular"
            color={conversation.unreadCount > 0 ? "primary" : "muted"}
          >
            {conversation.latestMessage && formatDateTime(conversation.latestMessage?.createdAt)}
          </AppText>
        </View>
        <View className="flex-row items-center justify-between w-full">
          <AppText
            variant="body-lg-regular"
            color="muted"
            numberOfLines={1}
            className="max-w-[90%]"
          >
            {conversation.latestMessage?.preview ?? "Hello"}
          </AppText>
          {conversation.unreadCount > 0 && (
            <View className="size-6 bg-primary-400 rounded-full justify-center items-center">
              <AppText color="onPrimary">{conversation.unreadCount}</AppText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
