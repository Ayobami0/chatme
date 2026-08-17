import { AppText, AppView } from "@components";

export default function HomeScreen() {
  return (
    <AppView withSafeArea>
      <AppText variant="h3" className="pt-[21]">
        Chats
      </AppText>
    </AppView>
  );
}
