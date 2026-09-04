import { AppBaseTextField } from "@components";
import { OutlineSearchSvg } from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { withOpacity } from "@shared/theme/color";

export function ChatsSearchField() {
  const iconColor = useThemeColor("primary-foreground");
  const placeholderColor = withOpacity(iconColor, 0.85);
  const borderColor = withOpacity(iconColor, 0.2);
  const backgroundColor = withOpacity(iconColor, 0.08);

  return (
    <AppBaseTextField
      icon={() => (
        <OutlineSearchSvg
          width={18}
          height={18}
          color={iconColor}
        />
      )}
      containerClass="flex-row gap-2 border-[0.5px] rounded-xl items-center pl-3"
      containerStyle={{
        backgroundColor,
        borderColor,
      }}
      placeholder="Search chat, people and more..."
      className="py-3"
      placeholderTextColor={placeholderColor}
    />
  );
}
