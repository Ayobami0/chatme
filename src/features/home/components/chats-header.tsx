import { AppText } from "@components";
import { View } from "react-native";
import { ChatsSearchField } from "./chats-search-field";

export function ChatsHeader() {
  return (
    <View className="pt-[60] px-6 bg-primary pb-4 gap-5">
      <AppText variant="h3" color="onPrimary" className="pt-[21]">
        Chats
      </AppText>
      <ChatsSearchField />
    </View>
  );
}
