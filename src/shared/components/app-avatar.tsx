import { Image, View } from "react-native";
import { AppText } from "./app-text";

type AppAvatarProps = {
  url?: string | null;
  name?: string | null;
  isOnline?: boolean;
  radius?: number;
  bordered?: boolean;
};

type AppAvatarWithNameProps = {
  name: string;
  isSelected?: boolean;
} & Omit<AppAvatarProps, "isOnline">;

export function AppAvatar(props: AppAvatarProps) {
  const { url, name, isOnline = true, radius = 56, bordered = false } = props;
  const initialLetter = name?.trim().charAt(0).toUpperCase() ?? "";
  const hasImage = Boolean(url && url.trim().length > 0);

  return (
    <View style={{ width: radius, height: radius }} className="relative">
      <View
        style={{ width: radius, height: radius }}
        className={`rounded-full overflow-hidden items-center justify-center ${
          hasImage ? "" : "bg-primary-400"
        } ${bordered ? "border-2 border-white" : ""}`}
      >
        {hasImage ? (
          <Image
            source={{ uri: url! }}
            style={{ width: radius, height: radius }}
          />
        ) : (
          <AppText
            color="onPrimary"
            variant="h4"
            style={{ fontSize: radius * 0.42 }}
          >
            {initialLetter}
          </AppText>
        )}
      </View>
      {isOnline && (
        <View className="absolute bottom-0 right-0 size-4 bg-primary-400 rounded-full border-2 border-surface" />
      )}
    </View>
  );
}

export function AppAvatarWithName() {}
