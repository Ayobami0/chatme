import { AppColor } from "@shared/theme/color";
import { AnyFieldApi } from "@tanstack/react-form";
import { useColorScheme } from "nativewind";
import { OtpInput } from "react-native-otp-entry";

type AppPinInputProps = {
  field?: AnyFieldApi
};

export function AppPinInput(props: AppPinInputProps) {
  const { field } = props;

  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === "dark";
  return (
    <OtpInput
      numberOfDigits={4}
      type="numeric"
      theme={{
        containerStyle: {
          paddingHorizontal: 16,
        },
        pinCodeContainerStyle: {
          width: 56,
          height: 56,
          borderRadius: 16,
          borderColor: isDark ? AppColor.neutral300 : AppColor.divider,
        },
        focusStickStyle: {
          backgroundColor: AppColor.primary400,
          height: 24,
        },
        focusedPinCodeContainerStyle: {
          borderColor: AppColor.primary400,
          backgroundColor: isDark ? AppColor.neutral800 : AppColor.primary50,
        },
      }}
      onBlur={field?.handleBlur}
      onTextChange={(text) => field?.handleChange(text)}
    />
  );
}
