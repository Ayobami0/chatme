import { ChatScreen } from "@features/chat/screens";
import { useLocalSearchParams } from "expo-router";

export default function Index() {
  const {
    conversationId,
    activeAt: encodedActiveAt,
    displayName: encodedDisplayName,
    profileUrl: encodedProfileUrl,
    participantId,
    isGroup,
  } = useLocalSearchParams<{
    conversationId: string;
    displayName: string;
    activeAt?: string;
    profileUrl?: string;
    participantId: string;
    isGroup: string;
  }>();

  const activeAt = encodedActiveAt ? new Date(encodedActiveAt) : undefined;

  const displayName = decodeURIComponent(encodedDisplayName);
  const profileUrl = encodedProfileUrl
    ? decodeURIComponent(encodedProfileUrl)
    : undefined;

  return (
    <ChatScreen
      isGroup={isGroup === "true"}
      conversationId={conversationId}
      participantId={participantId}
      activeAt={activeAt}
      fullName={displayName}
      profileUrl={profileUrl}
    />
  );
}
