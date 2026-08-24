import { AppText } from "@components";
import { AppColor } from "@shared/theme/color";
import { View } from "react-native";
import { ChatsSearchField } from "./chats-search-field";

export function ChatsHeader() {
  return (
    <View className="pt-[60] px-6 bg-primary pb-4 gap-5">
      <AppText variant="h3" className="pt-[21]" style={{ color:AppColor.white  }}>
        Chats
      </AppText>
      <ChatsSearchField />
    </View>
  );
}
