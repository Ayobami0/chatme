import { useThemeColor } from "@shared/hooks/use-theme-color";
import { AnyFieldApi } from "@tanstack/react-form";
import { OtpInput } from "react-native-otp-entry";

type AppPinInputProps = {
  field?: AnyFieldApi;
  length?: number;
};

export function AppPinInput(props: AppPinInputProps) {
  const { field, length = 4 } = props;

  const borderColor = useThemeColor("border");
  const focusColor = useThemeColor("focus");
  const focusBgColor = useThemeColor("focus-background");
  const textColor = useThemeColor("title");

  return (
    <OtpInput
      numberOfDigits={length}
      type="numeric"
      theme={{
        containerStyle: {
          paddingHorizontal: 16,
        },
        pinCodeContainerStyle: {
          width: 56,
          height: 56,
          borderRadius: 16,
          borderColor,
        },
        pinCodeTextStyle: {
          color: textColor,
        },
        focusStickStyle: {
          backgroundColor: focusColor,
          height: 24,
        },
        focusedPinCodeContainerStyle: {
          borderColor: focusColor,
          backgroundColor: focusBgColor,
        },
      }}
      onBlur={field?.handleBlur}
      onTextChange={(text) => field?.handleChange(text)}
    />
  );
}
