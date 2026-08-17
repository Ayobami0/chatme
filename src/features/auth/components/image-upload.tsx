import { IllustrationCircleSvg } from "@shared/components/svgs/assets";
import {
  SolidAddAPhotoSvg,
  SolidCheckCircleSvg,
  SolidCheckSvg,
  SolidUploadSvg,
} from "@shared/components/svgs/icons";
import { AppColor } from "@shared/theme/color";
import { useEffect } from "react";
import { Image, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

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
              <CircleProgress total={100} progress={20} />
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

function CircleProgress({
  total,
  progress,
}: {
  total: number;
  progress: number;
}) {
  const size = 48;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const percentage = Math.min(Math.max(progress / total, 0), 1);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={AppColor.divider}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={AppColor.primary400}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percentage)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <SolidUploadSvg color={AppColor.primary400} />
    </View>
  );
}
