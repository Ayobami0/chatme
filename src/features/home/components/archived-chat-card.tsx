import { AppText } from "@components";
import { SolidArchiveSvg } from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { AppColor } from "@shared/theme/color";
import { useColorScheme } from "nativewind";
import { Pressable, View } from "react-native";

type ArchivedChatCardProps = {
  count: number;
  onPress: () => void;
};

export function ArchivedChatCard({ count, onPress }: ArchivedChatCardProps) {
  const { colorScheme } = useColorScheme();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between p-3 h-14 rounded-xl mb-2"
    >
      <View className="flex-row items-center gap-3">
        <View className="size-16 items-center justify-center rounded-full bg-primary-400">
          <SolidArchiveSvg width={24} height={24} color={AppColor.white} />
        </View>
        <View className="gap-1">
          <AppText variant="body-lg-semibold">Archived Chat</AppText>
          <AppText variant="body-md-medium" color="subtext">
            {count} conversations
          </AppText>
        </View>
      </View>

      {count > 0 && (
        <View className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900">
          <AppText variant="body-md-semibold" color="primary">
            {count}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
