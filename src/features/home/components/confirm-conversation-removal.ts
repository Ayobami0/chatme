import { ConversationModel } from "@shared/types/models";
import { Alert } from "react-native";
import { showBulkOutcome } from "./bulk-outcome-toast";
import { describeRemoval } from "../utils/conversation-removal";
import { BulkResult, runBulk } from "../utils/run-bulk";

/**
 * Asks the user to confirm removing `conversations`, then runs `remove` for each
 * and reports the actual outcome once every request has settled.
 */
export function confirmConversationRemoval(
  conversations: ConversationModel[],
  remove: (conversation: ConversationModel) => Promise<unknown>,
  options?: { onDone?: (result: BulkResult<ConversationModel>) => void },
) {
  const copy = describeRemoval(conversations);

  Alert.alert(copy.title, copy.message, [
    { text: "Cancel", style: "cancel" },
    {
      text: copy.label,
      style: "destructive",
      onPress: async () => {
        const result = await runBulk(conversations, remove);
        options?.onDone?.(result);

        showBulkOutcome(result, { verb: "remove", past: "removed" });
      },
    },
  ]);
}
