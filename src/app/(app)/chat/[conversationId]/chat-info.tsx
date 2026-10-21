import { ChatInfoScreen } from "@features/chat/screens";
import { useLocalSearchParams } from "expo-router";

export default function Index() {
  const { conversationId: conversationID } = useLocalSearchParams<{ conversationId: string }>();
  return <ChatInfoScreen conversationID={conversationID} />;
}
