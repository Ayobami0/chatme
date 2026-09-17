import { ConversationModel } from "@shared/types/models";
import { View } from "react-native";
import { Row } from "./info-row";
import { OutlineBanSvg, OutlineDatabaseSvg } from "@shared/components/svgs/icons";
import { AppColor } from "@shared/theme/color";

type ChatInfoFooterProps = {
  conversation: ConversationModel;
};

export default function ChatInfoFooter({ conversation }: ChatInfoFooterProps) {
  const isGroup = conversation.type === "group";

  return (
    <View className="w-full px-6">
      {!isGroup && (
        <Row
          icon={OutlineBanSvg}
          label="Block contact"
          iconColor={AppColor.danger}
          textColor={AppColor.danger}
        />
      )}
    </View>
  );
}
