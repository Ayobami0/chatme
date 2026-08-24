import { AppBaseTextField } from "@components";
import { OutlineSearchSvg } from "@shared/components/svgs/icons";
import { AppColor, withOpacity } from "@shared/theme/color";
import { useColorScheme } from "nativewind";
import { TextInput, View } from "react-native";

export function ChatsSearchField() {
  const { colorScheme } = useColorScheme();
  return (
    <AppBaseTextField
      icon={() => (
        <OutlineSearchSvg
          width={18}
          height={18}
          color={colorScheme === "dark" ? AppColor.neutral200 : AppColor.white}
        />
      )}
      containerClass="flex-row gap-2 border-[0.5px] rounded-xl items-center pl-3"
      containerStyle={{
        backgroundColor: withOpacity(AppColor.white, 0.06),
        borderColor:
          colorScheme === "dark"
            ? AppColor.neutral400
            : withOpacity(AppColor.white, 0.16),
      }}
      placeholder="Search chat, people and more..."
      className="py-3"
      placeholderTextColor={
        colorScheme === "dark"
          ? AppColor.neutral200
          : withOpacity(AppColor.white, 0.9)
      }
    />
  );
}
