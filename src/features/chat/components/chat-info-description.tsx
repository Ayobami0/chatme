import { AppText } from "@components";
import { useThemeColor } from "@shared/hooks";
import { useState } from "react";
import { View } from "react-native";

export function ChatInfoDescription(props: { description: string }) {
  const [showMore, setShowMore] = useState(false);
  const color = useThemeColor('caption');
  return (
    <View className="px-4 py-6 gap-2">
      <AppText variant="h4">Description</AppText>
      <AppText variant="body-lg-regular" color='caption'>
        {props.description.substring(0, showMore ? undefined : 250)}{" "}
        {props.description.length > 250 && (
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
}
