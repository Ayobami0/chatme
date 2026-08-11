import { AppText } from "@components";
import { AppColor, withOpacity } from "@shared/theme/color";
import { Image } from "expo-image";
import { Color } from "expo-router";
import { useMemo } from "react";
import { ColorValue, View } from "react-native";

export function ChatBubbles({
  text,
  hasAvatar,
  isSender = true,
  extraText,
  isAlt = false,
  person = "woman",
}: {
  text?: string;
  extraText?: number;
  hasAvatar?: boolean;
  isSender?: boolean;
  isAlt?: boolean;
  person?: "man" | "woman";
}) {
  const hasText = Boolean(text?.trim());

  return (
    <View className="flex-row items-end gap-2">
      {!isSender && (
        <View
          className="rounded-full overflow-hidden"
          style={{
            width: 24,
            height: 24,
          }}
        >
          {hasAvatar && (
            <Image
              source={
                person === "man"
                  ? require("@assets/images/man_1.jpg")
                  : require("@assets/images/woman_1.jpg")
              }
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </View>
      )}
      <View
        className={` px-[10.49px] py-[7.87px] rounded-[10.49px] `}
        style={{
          backgroundColor: isSender
            ? AppColor.primary400
            : isAlt
              ? "#F3FFF7"
              : AppColor.white,
          borderBottomLeftRadius: isSender ? undefined : 0,
          borderBottomRightRadius: isSender ? 0 : undefined,
          shadowColor: "#183421",
          shadowOffset: {
            width: 0,
            height: 4.99,
          },
          shadowOpacity: 0.0588,
          shadowRadius: 32,
          elevation: 8,
        }}
      >
        {hasText ? (
          <AppText
            style={{ color: isSender ? AppColor.white : AppColor.primary900 }}
          >
            {text}
          </AppText>
        ) : (
          <View className="gap-2">
            {Array.from({ length: (extraText ?? 0) + 1 }).map((_, index) => (
              <View key={index} className="flex-row gap-2">
                <TextPlaceHolders
                  color={
                    isSender ? withOpacity(AppColor.white, 0.4) : "#C8EFDF"
                  }
                />
                <TextPlaceHolders
                  color={
                    isSender ? withOpacity(AppColor.white, 0.4) : "#C8EFDF"
                  }
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function TextPlaceHolders({ color }: { color: ColorValue }) {
  const width = useMemo(() => Math.floor(Math.random() * (100 - 40) + 40), []);

  return (
    <View
      className="rounded-full"
      style={{
        width,
        height: 6,
        backgroundColor: color,
      }}
    />
  );
}
