import { AppText } from "@components";
import { useThemeColor } from "@shared/hooks";
import {
  ConversationModel,
  DirectConversationModel,
} from "@shared/types/models";
import { useState } from "react";
import { View } from "react-native";

export function ChatInfoDescription(props: {
  conversation: ConversationModel;
}) {
  const [showMore, setShowMore] = useState(false);
  const isGroup = props.conversation.type == "group";
  const description = isGroup
    ? (props.conversation.description ??
      "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Explicabo debitis incidunt sequi quam, nihil neque iusto eaque dolorum repudiandae temporibus facere esse quaerat. Quisquam optio repellendus impedit hic, cum magni.")
    : "";

  if (isGroup)
    return (
      <View className="px-4 py-6 gap-2">
        <AppText variant="h4">Description</AppText>
        <AppText variant="body-lg-regular" color="caption">
          {description.substring(0, showMore ? undefined : 250)}{" "}
          {description.length > 250 && (
            <AppText
              color="primary"
              variant="button-lg"
              onPress={() => setShowMore(!showMore)}
            >
              {!showMore && <AppText>...</AppText>} Read{" "}
              {!showMore ? "more" : "less"}
            </AppText>
          )}
        </AppText>
      </View>
    );

  const conversation = props.conversation as DirectConversationModel;
  return (
    <View className="px-4 py-6 gap-3">
      <View className="gap-2">
        <AppText variant="h5">
          {conversation.otherParticipant.phone ?? "+61-123-753-555"}
        </AppText>
        <AppText variant="body-lg-regular" color="caption">
          Phone Number
        </AppText>
      </View>
      <View className="gap-2">
        <AppText variant="h5">{description}</AppText>
        <AppText variant="body-lg-regular" color="caption">
          Description
        </AppText>
      </View>
    </View>
  );
}
