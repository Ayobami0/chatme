import {
  FlatList,
  Pressable,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { AppText } from "./app-text";
import { useEffect, useState } from "react";
import { OutlineSearchSvg } from "./svgs/icons";
import * as countryCodes from "country-codes-list";
import CountryFlag from "react-native-country-flag";
import Animated, {
  interpolate,
  StyleProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { AppColor, withOpacity } from "@shared/theme/color";
import { AnyFieldApi } from "@tanstack/react-form";
import { useColorScheme } from "nativewind";
import { cn } from "@shared/utils/ui";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // turns off the extra strict-mode checks
});

type AppTextFieldProps = {
  label?: string;
  icon?: (props: { isFocused?: boolean }) => React.ReactNode;
  field?: AnyFieldApi;
  containerStyle?: StyleProps;
  containerClass?: string;
} & TextInputProps;

type AppControlledTextFieldProps = {} & AppTextFieldProps;

export function AppBaseTextField(props: AppTextFieldProps) {
  const { icon, containerStyle, containerClass, ...rest } = props;
  const { colorScheme } = useColorScheme();

  return (
    <View
      className={cn("flex-row gap-2 border-[0.5px] rounded-xl items-center pl-3", containerClass)}
      style={containerStyle}
    >
      {icon && <View>{icon({ isFocused: false })}</View>}
      <TextInput
        placeholder="Search chat, people and more..."
        cursorColor={colorScheme === "dark" ? AppColor.neutral200 : AppColor.white}
        selectionColor={colorScheme === "dark" ? AppColor.neutral200 : AppColor.white}
        style={{
          ...rest.style,
          color:
            colorScheme === "dark"
              ? AppColor.white
              : AppColor.neutral900,
        }}
        className="py-3"
        placeholderTextColor={
          colorScheme === "dark"
            ? AppColor.neutral200
            : withOpacity(AppColor.white, 0.9)
        }
        {...rest}
      />
    </View>
  );
}

export function AppTextField(props: AppTextFieldProps) {
  const {
    label,
    icon,
    field,
    onChangeText,
    onFocus,
    onBlur,
    keyboardType = "default",
    className,
    value,
    ...rest
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(
    field?.state.meta.isTouched && field.state.meta.errors.length > 0,
  );

  // Hold the last error message so it stays visible while fading out
  const [displayError, setDisplayError] = useState("");
  // Keep the error block mounted until the exit animation finishes
  const [showErrorBlock, setShowErrorBlock] = useState(hasError);

  const errorAnimation = useSharedValue(0);
  const errorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(errorAnimation.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(errorAnimation.value, [0, 1], [-4, 0]) },
    ],
  }));

  useEffect(() => {
    if (hasError) {
      setDisplayError(
        field?.state.meta.errors.map((e) => e.message).join(", ") ?? "",
      );
      setShowErrorBlock(true);
      errorAnimation.value = withTiming(1, { duration: 200 });
    } else {
      errorAnimation.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setShowErrorBlock)(false);
        }
      });
    }
  }, [hasError]);

  const Icon = icon;

  return (
    <View className="w-full">
      {label && (
        <AppText className="mb-2" color="subtext">
          {label}
        </AppText>
      )}

      <View
        className={`gap-3 flex-row border-hairline border-border rounded-2xl py-[18px] transition-colors duration-200 px-5 ${
          isFocused ? "border-focus bg-focus-background" : ""
        } ${hasError ? "border-danger bg-red-50" : ""} ${className ?? ""}`}
      >
        {Icon && <Icon isFocused={isFocused} />}

        <TextInput
          {...rest}
          className="flex-1"
          keyboardType={keyboardType}
          cursorColor={AppColor.primary400}
          selectionColor={AppColor.primary400}
          value={field?.state.value ?? value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onChangeText={(text) => {
            field?.handleChange(text);
            onChangeText?.(text);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            field?.handleBlur();
            onBlur?.(e);
          }}
        />
      </View>

      {showErrorBlock && (
        <Animated.View style={errorStyle}>
          <AppText color="danger" size={12} className="mx-4 mt-1">
            {displayError}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
}

export function AppPhoneTextField(
  props: Omit<AppTextFieldProps, "icon"> & {
    defaultCode: {
      countryCode: string;
      countryCallCode: string;
    };
    onCodeSelect?: (data: {
      countryCode: string;
      countryCallCode: string;
    }) => void;
  },
) {
  const { keyboardType, defaultCode, onCodeSelect, ...rest } = props;

  const [showPhoneSelector, setShowPhoneSelector] = useState(false);
  const [countryCallCode, setCountryCallCode] = useState(
    defaultCode.countryCallCode,
  );
  const [countryCode, setCountryCode] = useState(defaultCode.countryCode);

  const opacity = useSharedValue(0.85);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(opacity.value, [0.85, 1], [0, 1]),
    transform: [{ scale: opacity.value }],
  }));

  const closeCountrySelector = (data?: {
    countryCode: string;
    countryCallCode: string;
  }) => {
    opacity.value = withTiming(0.85, { duration: 200 }, (isFinished) => {
      if (isFinished) {
        runOnJS(setShowPhoneSelector)(false);
      }
    });
    if (data) {
      setCountryCallCode(data.countryCallCode);
      setCountryCode(data.countryCode);
      onCodeSelect?.(data);
    }
  };

  const openCountrySelector = () => {
    setShowPhoneSelector(true);
    opacity.value = withTiming(1, {
      duration: 200,
    });
  };

  return (
    <View className="w-full">
      <AppTextField
        keyboardType="phone-pad"
        icon={() => (
          <View>
            <Pressable
              className="flex-row items-center gap-3"
              onPress={
                showPhoneSelector
                  ? () => closeCountrySelector()
                  : openCountrySelector
              }
            >
              <View className="rounded-sm overflow-hidden">
                <CountryFlag isoCode={countryCode} size={16} />
              </View>
              <AppText variant="body-md-semibold">+{countryCallCode}</AppText>
            </Pressable>
          </View>
        )}
        {...rest}
      />
      <View className="relative">
        {showPhoneSelector && (
          <PhoneSelector
            style={animatedStyle}
            onSelect={closeCountrySelector}
          />
        )}
      </View>
    </View>
  );
}

export function AppSearchTextField(props: AppTextFieldProps) {}

export function AppControlledPhoneTextField(
  props: AppControlledTextFieldProps,
) {}

function PhoneSelector({
  onSelect,
  initialCountryCode,
  style,
}: {
  initialCountryCode?: string;
  onSelect: (data?: { countryCode: string; countryCallCode: string }) => void;
  style: StyleProps;
}) {
  const [search, setSearch] = useState("");

  const countries = countryCodes
    .all()
    .filter((country) =>
      country.countryNameEn.toLowerCase().includes(search.toLowerCase()),
    );

  return (
    <Animated.View
      style={style}
      className="absolute max-h-96 max-w-80 left-0 right-0 top-full z-60 mt-1 rounded-2xl border-hairline border-border bg-background p-3"
    >
      <View className="mx-1 h-9 flex-row items-center gap-2">
        <OutlineSearchSvg />

        <TextInput
          className="flex-1"
          placeholder="Search country..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        className="mt-2"
        contentContainerStyle={{ gap: 4 }}
        data={countries}
        keyExtractor={(item) => item.countryCode}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center">
            <AppText>No Countries Found</AppText>
          </View>
        )}
        renderItem={({ item }) => (
          <CountryItem
            isoCode={item.countryCode}
            name={item.countryNameEn}
            code={item.countryCallingCode}
            onPress={() => {
              onSelect({
                countryCode: item.countryCode,
                countryCallCode: item.countryCallingCode,
              });
            }}
            selected={item.countryCode === initialCountryCode}
          />
        )}
      />
    </Animated.View>
  );
}

function CountryItem({
  isoCode,
  name,
  code,
  onPress,
  selected,
}: {
  isoCode: string;
  name: string;
  code: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center rounded-lg p-3 gap-5 mr-1 ${selected ? "border-hairline border-primary" : ""}`}
    >
      <View className="rounded-sm overflow-hidden">
        <CountryFlag size={16} isoCode={isoCode.toLowerCase()} />
      </View>
      <AppText className="flex-1" color="body">
        {name}
      </AppText>
      <AppText color="subtext">+{code}</AppText>
    </Pressable>
  );
}
