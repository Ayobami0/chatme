import { ChatScreen } from "@features/chat/screens";
import { ConversationNotFound } from "@features/chat/components/conversation-not-found";
import { parseConversationId } from "@features/chat/navigation";
import { useLocalSearchParams } from "expo-router";

/** Works from the conversation id alone, e.g. from a deep link or notification. */
export default function Index() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const id = parseConversationId(conversationId);

  if (!id) return <ConversationNotFound />;
  return <ChatScreen conversationId={id} />;
}
