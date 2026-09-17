import {
  SolidCheveronLeftSvg,
  SolidQrcodeSvg,
  SolidSearchSvg,
} from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { FC } from "react";
import { TouchableOpacity, View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SvgProps } from "react-native-svg";
import {
  ConversationModel,
  DirectConversationModel,
  GroupConversationModel,
} from "@shared/types/models";
import { AppText } from "@components";

type ChatInfoHeaderProps = {
  conversation?: ConversationModel | null;
};

export default function ChatInfoHeader(props: ChatInfoHeaderProps) {
  const { conversation } = props;
  const type = conversation?.type ?? "direct";

  const title = () => {
    if (type === "group") return (conversation as GroupConversationModel)?.name;

    return (
      (conversation as DirectConversationModel)?.otherParticipant
        ?.displayName ?? "Chat"
    );
  };

  const avatarUrl =
    type === "group"
      ? (conversation as GroupConversationModel)?.avatarUrl
      : (conversation as DirectConversationModel)?.otherParticipant?.avatarUrl;

  return (
    <View className="pt-safe h-72 relative bg-primary overflow-hidden">
      {avatarUrl && (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            objectFit: "cover",
          }}
          className="absolute inset-0"
        />
      )}
      {avatarUrl && (
        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.85)"]}
          locations={[0, 0.4, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      )}
      <View className="pt-2 px-4 h-full">
        <View className="flex-row gap-3">
          <View className="flex-1 items-start">
            <ChatInfoIcon
              icon={SolidCheveronLeftSvg}
              onPress={() => router.back()}
            />
          </View>
          <ChatInfoIcon icon={SolidSearchSvg} />
          <ChatInfoIcon icon={SolidQrcodeSvg} />
        </View>
        <View className="justify-self-end flex-1 justify-end pb-6 px-2">
          <AppText variant="h2" color="onPrimary">
            {title()}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function ChatInfoIcon({
  icon,
  onPress,
}: {
  icon: FC<SvgProps>;
  onPress?: () => void;
}) {
  const iconColor = useThemeColor("primary-foreground");
  const Component = icon;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <BlurView
        className="items-center justify-center size-10 rounded-full overflow-hidden"
        tint="dark"
        intensity={85}
      >
        <Component width={24} height={24} color={iconColor} />
      </BlurView>
    </TouchableOpacity>
  );
}
