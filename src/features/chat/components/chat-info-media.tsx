import { queryKeys } from "@core/query/keys";
import { SolidVolumeUpSvg } from "@shared/components/svgs/icons";
import { ConversationService } from "@services/conversation";
import { ConversationModel } from "@shared/types/models";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch, View } from "react-native";
import { Row } from "./info-row";

type ChatInfoMediaProps = {
  conversation: ConversationModel;
};

/**
 * Photos, starred messages and shared links are hidden until those views and their
 * counts are backed by the API (see docs/feature-checklist.md).
 */
export default function ChatInfoMedia({ conversation }: ChatInfoMediaProps) {
  const queryClient = useQueryClient();
  const muted = conversation.settings?.muted ?? false;

  const toggleMute = useMutation({
    mutationFn: (mute: boolean) =>
      mute
        ? ConversationService.muteConversation(conversation.id, { duration: "always" })
        : ConversationService.unmuteConversation(conversation.id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversation.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });

  // Reflect the requested value while the request is in flight.
  const notificationsOn = toggleMute.isPending ? !toggleMute.variables : !muted;

  return (
    <View className="p-6">
      <Row
        icon={SolidVolumeUpSvg}
        label="Notifications"
        surfixIcon={
          <Switch
            value={notificationsOn}
            disabled={toggleMute.isPending}
            onValueChange={(on) => toggleMute.mutate(!on)}
            accessibilityLabel="Notifications"
          />
        }
      />
    </View>
  );
}
