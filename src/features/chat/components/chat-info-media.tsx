import {
  OutlineCheveronRightSvg,
  OutlineLinkSvg,
  OutlinePhotographSvg,
  OutlineStarSvg,
  SolidVolumeUpSvg,
} from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks";
import { ConversationModel } from "@shared/types/models";
import { Switch, View } from "react-native";
import { Row } from "./info-row";

type ChatInfoMediaProps = {
  conversation: ConversationModel;
};

export default function ChatInfoMedia({ conversation }: ChatInfoMediaProps) {
  const isGroup = conversation.type === "group";
  const muted = useThemeColor("subtext");
  return (
    <View className="p-6">
      <Row
        icon={OutlinePhotographSvg}
        label={`3 Photos`}
        surfixIcon={
          <OutlineCheveronRightSvg color={muted} width={20} height={20} />
        }
      />
      <Row
        icon={OutlineStarSvg}
        label={`43 star messages`}
        surfixIcon={
          <OutlineCheveronRightSvg color={muted} width={20} height={20} />
        }
      />
      <Row
        icon={OutlineLinkSvg}
        label={`19 shared links`}
        surfixIcon={
          <OutlineCheveronRightSvg color={muted} width={20} height={20} />
        }
      />
      {!isGroup && (
        <Row
          icon={SolidVolumeUpSvg}
          label={`Notifications`}
          surfixIcon={
            <Switch />
          }
        />
      )}
    </View>
  );
}
