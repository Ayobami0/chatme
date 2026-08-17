import { FC, useEffect, useState } from "react";
import { FlatList, Pressable, Image, View } from "react-native";
import { SvgProps } from "react-native-svg";
import { AppText } from "./app-text";
import { AppColor } from "@shared/theme/color";
import {
  requestPermissionsAsync,
  getAssetsAsync,
  getAssetInfoAsync,
  AssetInfo,
} from "expo-media-library";

export type AppMediaUploadProps = {
  children: React.ReactNode;
  showRecentImage?: boolean;
  recentImageCount?: number;
  onRecentImagePicked?: (path?: string) => void;
};

export type AppMediaActionProps = {
  icon: FC<SvgProps>;
  label: string;
  onPress: () => void;
};

export function AppMediaUpload(props: AppMediaUploadProps) {
  const {
    children,
    showRecentImage = false,
    recentImageCount = 10,
    onRecentImagePicked,
  } = props;
  const [images, setImages] = useState<AssetInfo[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const setUpMediaLibrary = async () => {
      const { granted, accessPrivileges } = await requestPermissionsAsync();

      if (!granted && accessPrivileges !== "limited") {
        return;
      }

      const assets = await getAssetsAsync({
        mediaType: "photo",
        sortBy: ["creationTime"],
        first: recentImageCount,
        resolveWithFullInfo: true,
      });

      const assetsInfo = await Promise.all(
        assets.assets.map(async (e) => getAssetInfoAsync(e)),
      );
      setImages(assetsInfo);
      setHasPermission(true);
    };

    setUpMediaLibrary();
  }, []);

  return (
    <View
      className="bg-surface py-2 rounded-2xl"
      style={{
        boxShadow: [
          {
            offsetX: 0,
            offsetY: 3,
            blurRadius: 8,
            spreadDistance: 0,
            color: "#18342103",
          },
          {
            offsetX: 0,
            offsetY: 6,
            blurRadius: 16,
            spreadDistance: 0,
            color: "#0C291D05",
          },
        ],
      }}
    >
      {showRecentImage && hasPermission && images.length > 0 && (
        <FlatList
          horizontal
          contentContainerStyle={{ flexGrow: 1 }}
          showsHorizontalScrollIndicator={false}
          data={images}
          keyExtractor={(i) => i.id}
          ItemSeparatorComponent={() => <View className="w-2" />}
          renderItem={({ item, index }) => {
            return (
              <Pressable
                onPress={() => onRecentImagePicked?.(item.localUri)}
                className={`size-16 overflow-hidden rounded-lg ${index === 0 ? "ml-2" : ""} ${index === images.length - 1 ? "mr-2" : ""}`}
              >
                <Image source={{ uri: item.localUri }} className="size-16" />
              </Pressable>
            );
          }}
        />
      )}
      <View className="px-2">{children}</View>
    </View>
  );
}

export function AppMediaAction(props: AppMediaActionProps) {
  const { icon: Icon, label, onPress } = props;
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 px-2 py-[10] "
    >
      <Icon color={AppColor.primary400} />
      <AppText>{label}</AppText>
    </Pressable>
  );
}
