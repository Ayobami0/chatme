import { ConversationModel } from "@shared/types/models";
import { View } from "react-native";
import { router } from "expo-router";
import { Row } from "./info-row";
import { OutlineLogoutSvg, OutlineTrashSvg } from "@shared/components/svgs/icons";
import { AppColor } from "@shared/theme/color";
import { useConversationRemoval } from "@features/home/query";
import { confirmConversationRemoval } from "@features/home/components/confirm-conversation-removal";
import {
  getRemovalAction,
  REMOVAL_COPY,
} from "@features/home/utils/conversation-removal";

type ChatInfoFooterProps = {
  conversation: ConversationModel;
};

export default function ChatInfoFooter({ conversation }: ChatInfoFooterProps) {
  const removalMutation = useConversationRemoval();
  const action = getRemovalAction(conversation);

  // "Block contact" is intentionally not shown until blocking is implemented end to end.
  return (
    <View className="w-full px-6">
      <Row
        icon={action === "leave-group" ? OutlineLogoutSvg : OutlineTrashSvg}
        label={REMOVAL_COPY[action].label}
        iconColor={AppColor.danger}
        textColor={AppColor.danger}
        onGo={() =>
          confirmConversationRemoval([conversation], removalMutation.mutateAsync, {
            onDone: ({ failed }) => {
              if (failed.length === 0) router.dismissTo("/chats");
            },
          })
        }
      />
    </View>
  );
}
