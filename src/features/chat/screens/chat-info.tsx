import { AppView } from "@components";
import { ConversationService } from "@services/conversation";
import { useQuery } from "@tanstack/react-query";
import ChatInfoHeader from "../components/chat-info-header";
import { ChatInfoDescription } from "../components/chat-info-description";
import { GroupConversationModel } from "@shared/types/models";

type ChatInfoProps = {
  conversationID: string;
};

export default function ChatInfoScreen(props: ChatInfoProps) {
  const { conversationID } = props;

  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationID],
    queryFn: () => ConversationService.getConversationById(conversationID),
  });

  const type = conversation?.type ?? "direct";

  return (
    <AppView className="p-0">
      <ChatInfoHeader conversation={conversation} />
      {type === "group" && (
        <ChatInfoDescription
          description={
            (conversation as GroupConversationModel)?.description ??
            "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos."
          }
        />
      )}
    </AppView>
  );
}
