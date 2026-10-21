import { useCallback, useEffect, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const BAR_WIDTH = 80;

type AppLinearProgressIndicatorProps = {
  thickness?: number;
  duration?: number;
};

export function AppLinearProgressIndicator({
  thickness = 0.5,
  duration = 1000,
}: AppLinearProgressIndicatorProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  // Bar's left edge travels from -BAR_WIDTH (fully off-screen left)
  // to trackWidth (fully off-screen right).
  const progress = useSharedValue(-BAR_WIDTH);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    if (trackWidth === 0) return;

    progress.value = -BAR_WIDTH;
    progress.value = withRepeat(
      withTiming(trackWidth, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [trackWidth, duration]);

  const animationStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value }],
  }));

  return (
    <View
      onLayout={onLayout}
      className="relative w-full overflow-hidden rounded-full bg-primary-100"
      style={{ height: thickness }}
    >
      <Animated.View
        className="absolute left-0 h-full rounded-full bg-primary"
        style={[{ width: BAR_WIDTH }, animationStyle]}
      />
    </View>
  );
}
