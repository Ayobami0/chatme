import { AppAvatar, AppText } from "@components";
import { OutlineAddUserSvg } from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks";
import {
  GroupConversationModel,
  GroupConversationParticipant,
} from "@shared/types/models";
import { View } from "react-native";

type ChatInfoGroupMembersProps = {
  conversation: GroupConversationModel;
};

export function ChatInfoGroupMembers({
  conversation,
}: ChatInfoGroupMembersProps) {
  const iconColor = useThemeColor('subtext');
  return (
    <View className="py-3 px-6 gap-3">
      <View className="flex-row items-center justify-between">
        <AppText variant='body-lg-medium'>
          {conversation.participants.length}{" "}
          {`member${conversation.participants.length !== 1 ? "s" : ""}`}
        </AppText>
        <OutlineAddUserSvg color={iconColor} />
      </View>
      <View className="gap-3">
        {conversation.participants.map((participant) => (
          <GroupMemberCard key={participant.id} participant={participant} />
        ))}
      </View>
    </View>
  );
}

function GroupMemberCard({
  participant,
}: {
  participant: GroupConversationParticipant;
}) {
  return (
    <View className="gap-4 flex-row">
      <AppAvatar
        url={participant.avatarUrl}
        name={participant.displayName}
        size={56}
        isOnline={false}
      />
      <View className="gap-1 py-2">
        <AppText variant='body-lg-semibold'>{participant.displayName}</AppText>
        <AppText variant='body-lg-regular' color="primary">Online</AppText>
      </View>
    </View>
  );
}
