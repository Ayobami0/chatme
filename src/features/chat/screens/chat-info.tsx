import { AppView } from "@components";
import { useConversationDetails } from "../query";
import { ChatInfoDescription } from "../components/chat-info-description";
import { GroupConversationModel } from "@shared/types/models";
import { ScrollView, View } from "react-native";
import ChatInfoMedia from "../components/chat-info-media";
import ChatInfoFooter from "../components/chat-info-footer";
import { EditGroupModal } from "../components/edit-group-modal";
import { useState } from "react";
import { ChatInfoGroupMembers } from "../components/chat-info-group-members";
import ChatInfoHeader from "../components/chat-info-header";
import { ChatInfoNavHeader } from "../components/chat-info-nav-header";

type ChatInfoProps = {
  conversationID: string;
};

export default function ChatInfoScreen(props: ChatInfoProps) {
  const { conversationID } = props;
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const { data: conversation } = useConversationDetails(conversationID);
  const isGroup = conversation?.type === "group";

  return (
    <AppView className="p-0 relative">
      <ChatInfoNavHeader />
      <ScrollView showsVerticalScrollIndicator={false}>
        <ChatInfoHeader
          conversation={conversation}
          onEditPress={() => setIsEditModalVisible(true)}
        />
        {conversation && <ChatInfoDescription conversation={conversation} />}
        <View className="w-full h-2 bg-divider" />
        {conversation && <ChatInfoMedia conversation={conversation} />}
        <View className="w-full h-2 bg-divider" />
        {conversation && <ChatInfoFooter conversation={conversation} />}
        {isGroup && (
          <>
            <ChatInfoGroupMembers
              conversation={conversation as GroupConversationModel}
            />
            <View className="w-full h-2 bg-divider" />
          </>
        )}
        {isGroup && (
          <EditGroupModal
            isVisible={isEditModalVisible}
            onClose={() => setIsEditModalVisible(false)}
            conversation={conversation as GroupConversationModel}
          />
        )}
      </ScrollView>
    </AppView>
  );
}
