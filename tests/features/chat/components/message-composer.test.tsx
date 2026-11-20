import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { useDraftsStore } from "@features/chat/store/drafts";
import { MessageComposer } from "@features/chat/components/message-composer";

const renderComposer = (conversationId = "c1") => {
  const onSend = jest.fn();
  const utils = render(
    <MessageComposer
      conversationId={conversationId}
      onSend={onSend}
      onTyping={jest.fn()}
      onBlur={jest.fn()}
    />,
  );
  return { ...utils, onSend };
};

const sendButton = () => screen.getByRole("button", { name: "Send message" });
const input = () => screen.getByLabelText("Message");

describe("MessageComposer", () => {
  beforeEach(() => useDraftsStore.getState().clear());

  it("disables Send for an empty or whitespace-only draft", () => {
    const { onSend } = renderComposer();
    expect(sendButton()).toBeDisabled();

    fireEvent.changeText(input(), "   ");
    expect(sendButton()).toBeDisabled();

    fireEvent.press(sendButton());
    expect(onSend).not.toHaveBeenCalled();
  });

  it("sends the trimmed text once and clears the draft", () => {
    const { onSend } = renderComposer();

    fireEvent.changeText(input(), "  hello  ");
    expect(sendButton()).toBeEnabled();
    fireEvent.press(sendButton());
    fireEvent.press(sendButton()); // a double tap must not send twice

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("hello", []);
    expect(input()).toHaveProp("value", "");
    expect(sendButton()).toBeDisabled();
  });

  it("keeps an unsent draft per conversation across remounts", () => {
    const first = renderComposer("c1");
    fireEvent.changeText(input(), "draft for c1");
    first.unmount();

    renderComposer("c2");
    expect(input()).toHaveProp("value", "");
    screen.unmount();

    renderComposer("c1");
    expect(input()).toHaveProp("value", "draft for c1");
  });
});
