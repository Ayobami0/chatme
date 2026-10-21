import { AppText } from "@components";
import { log } from "@core/logging";
import { SolidBackspaceSvg } from "@shared/components/svgs/icons";
import { ReactNode, useState } from "react";
import { TouchableOpacity, View } from "react-native";

export function PinCode() {
  const [enabled, setEnabled] = useState(0);
  const [pin, setPin] = useState("");
  const count = 4;

  log.info(pin);
  return (
    <View className="flex-1 justify-end gap-[102] mt-8">
      <PinCodeEntry count={count} enabled={enabled} />
      <PinCodeDial
      canSubmit={enabled===4}
        onPress={(action) => {
          if (action == "delete") {
            if (enabled <= 0) return;
            setEnabled((enabled) => enabled - 1);
            setPin((v) => v.substring(0, v.length - 1));
            return;
          }
          if (enabled >= count) return;
          const num = action as number;
          setEnabled((enabled) => enabled + 1);
          setPin((v) => v + num.toString());
        }}
      />
    </View>
  );
}

function PinCodeEntry({
  count,
  enabled = 0,
}: {
  count: number;
  enabled?: number;
}) {
  return (
    <View className="flex-row justify-center gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className={`size-4 rounded-full ${enabled >= i + 1 ? "bg-primary" : "border-hairline border-border"}`}
        />
      ))}
    </View>
  );
}

function PinDial({
  children,
  onPress,
}: {
  children?: ReactNode;
  onPress?: () => void;
}) {
  if (!children) return <View className="size-[72]" />;

  return (
    <TouchableOpacity
      activeOpacity={0.5}
      onPress={onPress}
      className="items-center justify-center size-[72] rounded-full border-hairline border-border"
    >
      {children}
    </TouchableOpacity>
  );
}

function PinDialRow({ children }: { children: ReactNode }) {
  return <View className="flex-row justify-between">{children}</View>;
}

function PinCodeDial({
  onPress,
  canSubmit = false
}: {
    canSubmit?: boolean;
  onPress: (action: number | "delete") => void;
}) {
  return (
    <View className="gap-6">
      {[
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ].map((arr, i) => (
        <PinDialRow key={i}>
          {arr.map((v, j) => (
            <PinDial key={j} onPress={() => onPress(v)}>
              <AppText>{v}</AppText>
            </PinDial>
          ))}
        </PinDialRow>
      ))}
      <PinDialRow>
        <PinDial>
          {canSubmit && <AppText>OK</AppText>}
        </PinDial>
        <PinDial onPress={() => onPress(0)}>
          <AppText>0</AppText>
        </PinDial>
        <PinDial onPress={() => onPress("delete")}>
          <SolidBackspaceSvg width={24} height={24} />
        </PinDial>
      </PinDialRow>
    </View>
  );
}
