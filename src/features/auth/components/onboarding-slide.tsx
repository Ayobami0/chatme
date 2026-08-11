import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@components";
import { AppColor } from "@shared/theme/color";
import {
  SolidCheveronLeftSvg,
  SolidUserGroupSvg,
} from "@shared/components/svgs/icons";

import { ChatBubbles } from "./chat-bubbles";

function useSlideScale(
  scrollY: SharedValue<number>,
  height: number,
  index: number,
) {
  return useAnimatedStyle(() => {
    const distance = Math.abs(
      scrollY.value - height * index,
    );

    return {
      opacity: interpolate(
        distance,
        [0, height],
        [1, 0.5],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            distance,
            [0, height],
            [1, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });
}

export function OnboardingSlide() {
  const [height, setHeight] = useState(0);
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <Animated.ScrollView
      onScroll={onScroll}
      onLayout={(event) => {
        setHeight(event.nativeEvent.layout.height);
      }}
      pagingEnabled
      className="flex-1"
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      <Slide1
        height={height}
        scrollY={scrollY}
      />

      <Slide2
        height={height}
        scrollY={scrollY}
      />

      <Slide3
        height={height}
        scrollY={scrollY}
      />
    </Animated.ScrollView>
  );
}

function Slide1({
  height,
  scrollY,
}: {
  height: number;
  scrollY: SharedValue<number>;
}) {
  const man2Pop = useSharedValue(0.5);
  const man3Pop = useSharedValue(0.5);
  const woman4Pop = useSharedValue(0.5);
  const woman5Pop = useSharedValue(0.5);
  const woman6Pop = useSharedValue(0.5);

  const man2Opacity = useSharedValue(0);
  const man3Opacity = useSharedValue(0);
  const woman4Opacity = useSharedValue(0);
  const woman5Opacity = useSharedValue(0);
  const woman6Opacity = useSharedValue(0);

  useEffect(() => {
    const pop = (
      scale: SharedValue<number>,
      opacity: SharedValue<number>,
      delay: number,
    ) => {
      opacity.value = withDelay(
        delay,
        withTiming(1, {
          duration: 150,
        }),
      );

      scale.value = withDelay(
        delay,
        withSequence(
          withTiming(1.15, {
            duration: 350,
          }),
          withSpring(1, {
            damping: 50,
            stiffness: 180,
          }),
        ),
      );
    };

    pop(man2Pop, man2Opacity, 0);
    pop(man3Pop, man3Opacity, 100);
    pop(woman4Pop, woman4Opacity, 180);
    pop(woman5Pop, woman5Opacity, 260);
    pop(woman6Pop, woman6Opacity, 340);
  }, []);

  const scrollScale = useSlideScale(
    scrollY,
    height,
    0,
  );

  const man2PopStyle = useAnimatedStyle(() => ({
    opacity: man2Opacity.value,
    transform: [{ scale: man2Pop.value }],
  }));

  const man3PopStyle = useAnimatedStyle(() => ({
    opacity: man3Opacity.value,
    transform: [{ scale: man3Pop.value }],
  }));

  const woman4PopStyle = useAnimatedStyle(() => ({
    opacity: woman4Opacity.value,
    transform: [{ scale: woman4Pop.value }],
  }));

  const woman5PopStyle = useAnimatedStyle(() => ({
    opacity: woman5Opacity.value,
    transform: [{ scale: woman5Pop.value }],
  }));

  const woman6PopStyle = useAnimatedStyle(() => ({
    opacity: woman6Opacity.value,
    transform: [{ scale: woman6Pop.value }],
  }));

  return (
    <View
      className="relative"
      style={{ height }}
    >
      <Animated.View
        className="absolute right-[60px] top-[72px]"
        style={scrollScale}
      >
        <Animated.View style={man2PopStyle}>
          <Image
            source={require("@assets/images/man_2.png")}
            style={{
              width: 175,
              height: 175,
            }}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View
        className="absolute -left-[62px] top-[212px]"
        style={scrollScale}
      >
        <Animated.View style={man3PopStyle}>
          <Image
            source={require("@assets/images/man_3.png")}
            style={{
              width: 124,
              height: 124,
            }}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View
        className="absolute left-[70px] top-[188px]"
        style={scrollScale}
      >
        <Animated.View style={woman4PopStyle}>
          <Image
            source={require("@assets/images/woman_4.png")}
            style={{
              width: 48,
              height: 48,
            }}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View
        className="absolute right-[83px] top-[276px]"
        style={scrollScale}
      >
        <Animated.View style={woman5PopStyle}>
          <Image
            source={require("@assets/images/woman_5.png")}
            style={{
              width: 100,
              height: 100,
            }}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View
        className="absolute -right-[40px] top-[220px]"
        style={scrollScale}
      >
        <Animated.View style={woman6PopStyle}>
          <Image
            source={require("@assets/images/woman_6.png")}
            style={{
              width: 80,
              height: 80,
            }}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Slide2({
  height,
  scrollY,
}: {
  height: number;
  scrollY: SharedValue<number>;
}) {
  const scrollScale = useSlideScale(
    scrollY,
    height,
    1,
  );

  const firstChatStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [height * 0.4, height * 0.7],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [height * 0.4, height * 0.7],
          [0.7, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const secondChatStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [height * 0.6, height],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          scrollY.value,
          [height * 0.6, height],
          [0.7, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View
      className="relative px-6 pt-12"
      style={{ height }}
    >
      <Animated.View
        className="absolute right-28 top-[50px] z-50"
        style={firstChatStyle}
      >
        <ChatBubbles text="Hi Adele, How's your day?" />
      </Animated.View>

      <Animated.View
        className="absolute left-32 top-[240px] z-50"
        style={secondChatStyle}
      >
        <ChatBubbles
          text={`Hi Selena, i’m fine thank you.
How’s your day?`}
          isSender={false}
        />
      </Animated.View>

      <View className="flex-row items-center justify-between">
        <Animated.View style={scrollScale}>
          <Image
            style={{
              width: 165,
              height: 107,
            }}
            contentFit="contain"
            source={require("@assets/images/man_1.png")}
          />
        </Animated.View>

        <Animated.View style={scrollScale}>
          <Image
            style={{
              width: 119,
              height: 198,
            }}
            contentFit="contain"
            source={require("@assets/images/woman_1.png")}
          />
        </Animated.View>
      </View>

      <View className="flex-row justify-between pt-4">
        <Animated.View
          className="pt-5"
          style={scrollScale}
        >
          <Image
            style={{
              width: 154,
              height: 107,
            }}
            contentFit="contain"
            source={require("@assets/images/woman_2.png")}
          />
        </Animated.View>

        <Animated.View style={scrollScale}>
          <Image
            style={{
              width: 119,
              height: 62,
            }}
            contentFit="contain"
            source={require("@assets/images/woman_3.png")}
          />
        </Animated.View>
      </View>
    </View>
  );
}

function Slide3({
  height,
  scrollY,
}: {
  height: number;
  scrollY: SharedValue<number>;
}) {
  const scrollScale = useSlideScale(
    scrollY,
    height,
    2,
  );

  return (
    <View
      className="px-14 justify-end"
      style={{ height }}
    >
      <Animated.View
        style={[
          scrollScale,
          {
            backgroundColor: AppColor.whiteOther,
          },
        ]}
        className="p-3 pb-0 rounded-t-[32px]"
      >
        <View className="bg-primary rounded-t-3xl">
          <View
            className="rounded-b-[100px] w-min px-7 pt-1 pb-2 flex-row justify-center gap-1 self-center"
            style={{
              backgroundColor: AppColor.whiteOther,
            }}
          >
            <View className="h-2 w-14 rounded-[100px] bg-white" />
            <View className="size-2 rounded-[100px] bg-white" />
          </View>

          <View className="flex-row px-4 py-5 items-center">
            <SolidCheveronLeftSvg
              className="mr-[6px]"
              color={AppColor.white}
            />

            <View className="rounded-full justify-center items-center size-7 bg-white mr-2">
              <Image
                source={require(
                  "@assets/images/onboarding_group_logo.png",
                )}
                style={{
                  width: 14,
                  height: 14,
                }}
              />
            </View>

            <View className="gap-1">
              <View className="flex-row gap-2 items-center">
                <SolidUserGroupSvg color={AppColor.white} />

                <AppText
                  size={11}
                  style={{ color: AppColor.white }}
                >
                  Work Team
                </AppText>
              </View>

              <View className="w-12 h-1 bg-white/40 rounded-full" />
            </View>
          </View>
        </View>

        <View className="bg-background p-4 gap-4">
          <View className="self-start">
            <ChatBubbles
              isAlt
              isSender={false}
            />
          </View>

          <View className="self-start">
            <ChatBubbles
              isAlt
              isSender={false}
              extraText={1}
              hasAvatar
            />
          </View>

          <View className="self-end">
            <ChatBubbles />
          </View>

          <View className="self-start">
            <ChatBubbles
              isAlt
              isSender={false}
              extraText={3}
              hasAvatar
              person="man"
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
