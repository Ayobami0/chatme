import { AppText } from "@components";
import { Pressable, View } from "react-native";
import { ChatsSearchField } from "./chats-search-field";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import {
  OutlineArchiveSvg,
  OutlinePushPinSvg,
  SolidArchiveSvg,
  SolidBellSvg,
  SolidPushPinSvg,
  SolidTrashSvg,
  SolidVolumeOff1Svg,
  SolidXSvg,
} from "@shared/components/svgs/icons";

export type ChatsHeaderProps = {
  selectedCount?: number;
  isAllPinned?: boolean;
  isAllMuted?: boolean;
  isAllArchived?: boolean;
  onClearSelection?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onMute?: () => void;
  onDelete?: () => void;
};

export function ChatsHeader(props: ChatsHeaderProps) {
  const {
    selectedCount = 0,
    isAllPinned = false,
    isAllMuted = false,
    isAllArchived = false,
    onClearSelection,
    onPin,
    onArchive,
    onMute,
    onDelete,
  } = props;
  const onPrimaryColor = useThemeColor("primary-foreground");

  const PinIcon = isAllPinned ? OutlinePushPinSvg : SolidPushPinSvg;
  const ArchiveIcon = isAllArchived ? OutlineArchiveSvg : SolidArchiveSvg;
  const MuteIcon = isAllMuted ? SolidBellSvg : SolidVolumeOff1Svg;

  return (
    <View className="pt-[60] px-6 bg-primary pb-4 gap-5">
      {selectedCount > 0 ? (
        <View className="flex-row items-center justify-between pt-[21]">
          <View className="flex-row items-center gap-4">
            <Pressable onPress={onClearSelection} className="p-1" accessibilityRole="button" accessibilityLabel="Clear selection">
              <SolidXSvg width={20} height={20} color={onPrimaryColor} />
            </Pressable>
            <AppText variant="h4" color="onPrimary" accessibilityLiveRegion="polite">
              {selectedCount} selected
            </AppText>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable onPress={onPin} className="p-1" accessibilityRole="button" accessibilityLabel={isAllPinned ? "Unpin selected chats" : "Pin selected chats"}>
              <PinIcon width={22} height={22} color={onPrimaryColor} />
            </Pressable>
            <Pressable onPress={onArchive} className="p-1" accessibilityRole="button" accessibilityLabel={isAllArchived ? "Unarchive selected chats" : "Archive selected chats"}>
              <ArchiveIcon width={22} height={22} color={onPrimaryColor} />
            </Pressable>
            <Pressable onPress={onMute} className="p-1" accessibilityRole="button" accessibilityLabel={isAllMuted ? "Unmute selected chats" : "Mute selected chats"}>
              <MuteIcon width={22} height={22} color={onPrimaryColor} />
            </Pressable>
            <Pressable onPress={onDelete} className="p-1" accessibilityRole="button" accessibilityLabel="Remove selected chats">
              <SolidTrashSvg width={22} height={22} color={onPrimaryColor} />
            </Pressable>
          </View>
        </View>
      ) : (
        <AppText variant="h3" color="onPrimary" className="pt-[21]">
          Chats
        </AppText>
      )}

      <ChatsSearchField />
    </View>
  );
}
