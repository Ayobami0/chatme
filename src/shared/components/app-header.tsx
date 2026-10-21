import { TouchableOpacity, View } from "react-native";
import { OutlineCheveronLeftSvg } from "./svgs/icons";

type AppHeaderProps = {
  onBack?: () => void;
};

export function AppHeader(props: AppHeaderProps) {
  const { onBack } = props;

  return (
    <View>
      {onBack && (
        <TouchableOpacity
          activeOpacity={0.8}
          className="items-center justify-center border-hairline border-border size-10 rounded-xl mt-3"
          onPress={onBack}
        >
          <OutlineCheveronLeftSvg height={20} width={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}
