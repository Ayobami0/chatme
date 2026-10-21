import { IllustrationCircleSvg } from "@shared/components/svgs/assets";
import {
  SolidAddAPhotoSvg,
  SolidCheckCircleSvg,
  SolidCheckSvg,
  SolidUploadSvg,
} from "@shared/components/svgs/icons";
import { AppColor } from "@shared/theme/color";
import { useEffect } from "react";
import { ActivityIndicator, Image, View } from "react-native";

export type ImageIllustrationState = "uploading" | "idle" | "uploaded";

export type ImageIllustrationProps = {
  state?: ImageIllustrationState;
  uploadedImageUri?: string;
};

export function ImageIllustration(props: ImageIllustrationProps) {
  const { state = "idle", uploadedImageUri } = props;

  if (state === "uploaded" && uploadedImageUri) {
    return (
      <View className="relative size-[132]">
        <View className="items-center justify-center size-10 absolute bg-primary-400 z-10 rounded-full top-0 right-0">
          <SolidCheckSvg color="#FFFFFF" />
        </View>
        <Image
          source={{ uri: uploadedImageUri }}
          className="rounded-full w-full h-full"
        />
      </View>
    );
  }

  return (
    <View className="relative">
      {state === "idle" && (
        <View className="absolute top-0 right-1 bg-primary-400 rounded-full size-10 z-50 items-center justify-center">
          <SolidAddAPhotoSvg color={AppColor.white} />
        </View>
      )}
      <View className="rounded-full size-[164] bg-primary-50 relative overflow-hidden">
        <View className="-left-2 -top-2 rounded-full size-[77] bg-primary-100 absolute" />
        <View className="-bottom-2 -right-2 rounded-full size-[77] bg-primary-100 absolute" />
        <View className="absolute size-full justify-end -bottom-3">
          <View className=" bg-white items-center self-center rounded-2xl pt-4 pb-[47]">
            {state === "uploading" ? (
              <ActivityIndicator size="large" color={AppColor.primary400} />
            ) : (
              <IllustrationCircleSvg />
            )}
            <View className="h-[6] w-[76] bg-primary-200 rounded-xl mt-4 mb-2 mx-5" />
            <View className="h-[6] w-[60] bg-primary-200 rounded-xl" />
          </View>
          <View />
        </View>
      </View>
    </View>
  );
}
