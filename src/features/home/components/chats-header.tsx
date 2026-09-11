import { AppText } from "@components";
import { Pressable, View } from "react-native";
import { ChatsSearchField } from "./chats-search-field";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import {
  OutlineArchiveSvg,
  SolidBookmarkSvg,
  SolidTrashSvg,
  SolidVolumeOff1Svg,
  SolidXSvg,
} from "@shared/components/svgs/icons";

export type ChatsHeaderProps = {
  selectedCount?: number;
  onClearSelection?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
};

export function ChatsHeader(props: ChatsHeaderProps) {
  const {
    selectedCount = 0,
    onClearSelection,
    onPin,
    onArchive,
    onMute,
    onDelete,
  } = props;
  const onPrimaryColor = useThemeColor("primary-foreground");

  if (selectedCount > 0) {
    return (
      <View className="pt-[60] px-6 bg-primary pb-4 h-[140px] flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <Pressable onPress={onClearSelection} className="p-1">
            <SolidXSvg width={20} height={20} color={onPrimaryColor} />
          </Pressable>
          <AppText variant="h4" color="onPrimary">
            {selectedCount} selected
          </AppText>
        </View>

        <View className="flex-row items-center gap-5">
          <Pressable onPress={onPin} className="p-1">
            <SolidBookmarkSvg width={22} height={22} color={onPrimaryColor} />
          </Pressable>
          <Pressable onPress={onArchive} className="p-1">
            <OutlineArchiveSvg width={22} height={22} color={onPrimaryColor} />
          </Pressable>
          <Pressable onPress={onMute} className="p-1">
            <SolidVolumeOff1Svg width={22} height={22} color={onPrimaryColor} />
          </Pressable>
          <Pressable onPress={onDelete} className="p-1">
            <SolidTrashSvg width={22} height={22} color={onPrimaryColor} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="pt-[60] px-6 bg-primary pb-4 gap-5">
      <AppText variant="h3" color="onPrimary" className="pt-[21]">
        Chats
      </AppText>
      <ChatsSearchField />
    </View>
  );
}
