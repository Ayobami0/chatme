import { FC } from "react";
import { SvgProps } from "react-native-svg";
import Toast from "react-native-toast-message";
import { BulkResult } from "../utils/run-bulk";

/** e.g. { verb: "pin", past: "pinned" } */
export type BulkActionLabel = { verb: string; past: string; icon?: FC<SvgProps> };

export function describeBulkOutcome(
  { succeeded, failed }: BulkResult<unknown>,
  { verb, past }: BulkActionLabel,
): string {
  const chats = (n: number) => (n === 1 ? "Chat" : `${n} chats`);

  if (failed.length === 0) return `${chats(succeeded.length)} ${past}`;
  if (succeeded.length === 0) {
    return `Unable to ${verb} ${failed.length === 1 ? "chat" : `${failed.length} chats`}. Try again.`;
  }
  return `${succeeded.length} ${past}, ${failed.length} failed`;
}

/** Shows the actual outcome once every request in a bulk action has settled. */
export function showBulkOutcome(result: BulkResult<unknown>, label: BulkActionLabel) {
  Toast.show({
    type: "native",
    position: "bottom",
    text1: describeBulkOutcome(result, label),
    props: { icon: label.icon },
  });
}
