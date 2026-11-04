import { ChatInfoScreen } from "@features/chat/screens";
import { ConversationNotFound } from "@features/chat/components/conversation-not-found";
import { parseConversationId } from "@features/chat/navigation";
import { useLocalSearchParams } from "expo-router";

export default function Index() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const id = parseConversationId(conversationId);

  if (!id) return <ConversationNotFound />;
  return <ChatInfoScreen conversationID={id} />;
}
