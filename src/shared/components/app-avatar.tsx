import { Image } from "react-native";
import { View } from "react-native";

type AppAvatarProps = {
  url: string;
  isOnline?: boolean;
  radius?: number;
  bordered?: boolean;
};

type AppAvatarWithNameProps = {
  name: string;
  isSelected?: boolean;
} & Omit<AppAvatarProps, "isOnline">;

export function AppAvatar(props: AppAvatarProps) {
  const { url, isOnline = true, radius = 56, bordered = false } = props;
  return (
    <View className={`relative size-${radius}`}>
      <View className={`rounded-full overflow-hidden ${bordered ? "border-2 border-white" : ""}`}>
        <Image source={{ uri: url }} width={radius} height={radius} />
      </View>
      {isOnline && (
        <View className="absolute bottom-0 right-0 size-4 bg-primary-400 rounded-full border-2 border-surface"/>
      )}
    </View>
  );
}

export function AppAvatarWithName() {}
