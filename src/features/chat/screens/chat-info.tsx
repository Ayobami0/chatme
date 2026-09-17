import { AppView } from "@components";
import { useConversationDetails } from "../query";
import ChatInfoHeader from "../components/chat-info-header";
import { ChatInfoDescription } from "../components/chat-info-description";
import { GroupConversationModel } from "@shared/types/models";
import { View } from "react-native";
import ChatInfoMedia from "../components/chat-info-media";
import ChatInfoFooter from "../components/chat-info-footer";

type ChatInfoProps = {
  conversationID: string;
};

export default function ChatInfoScreen(props: ChatInfoProps) {
  const { conversationID } = props;

  const { data: conversation } = useConversationDetails(conversationID);

  const type = conversation?.type ?? "direct";

  return (
    <AppView className="p-0">
      <ChatInfoHeader conversation={conversation} />
      {conversation && <ChatInfoDescription conversation={conversation} />}
      <View className="w-full h-2 bg-divider" />
      {conversation && <ChatInfoMedia conversation={conversation} />}
      <View className="w-full h-2 bg-divider" />
      {conversation && <ChatInfoFooter conversation={conversation} />}
    </AppView>
  );
}
