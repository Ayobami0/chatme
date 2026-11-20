jest.mock("@components", () => {
  const { Pressable, Text, View } = require("react-native");
  return {
    AppView: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    AppHeader: () => null,
    AppText: ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>,
    AppButton: ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});
jest.mock("../../components/image-upload", () => ({ ImageIllustration: () => null }));
jest.mock("../../components/image-picker-modal", () => {
  const { Pressable, Text } = require("react-native");
  return function MockImagePickerModal({
    isVisible,
    onClose,
  }: {
    isVisible: boolean;
    onClose: (img?: unknown) => void;
  }) {
    return isVisible ? (
      <Pressable onPress={() => onClose({ uri: "file:///me.jpg", mimeType: "image/jpeg", fileSize: 10 })}>
        <Text>pick</Text>
      </Pressable>
    ) : null;
  };
});
const mockUpload = jest.fn();
jest.mock("@shared/hooks/use-upload", () => ({ useUpload: () => ({ upload: mockUpload }) }));
jest.mock("@services/auth", () => ({ AuthService: { setProfileAvatar: jest.fn() } }));
const mockSetUser = jest.fn();
const mockCompleteProfileSetup = jest.fn();
jest.mock("@shared/context/auth-context", () => ({
  useAuth: () => ({ setUser: mockSetUser, completeProfileSetup: mockCompleteProfileSetup }),
}));
jest.mock("expo-router", () => ({
  router: { canGoBack: () => false, back: jest.fn(), dismissTo: jest.fn() },
}));

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { TokenManager } from "@services/token-manager";
import React from "react";
import { AuthService } from "@services/auth";
import ProfileImageScreen from "../image";

const setProfileAvatar = AuthService.setProfileAvatar as jest.Mock;

/** Presses inside an async act, so the async work they start settles within it. */
const press = (text: string) =>
  act(async () => {
    fireEvent.press(await screen.findByText(text));
  });

const choosePhoto = async () => {
  await press("Upload Photo");
  await press("pick");
};

describe("ProfileImageScreen", () => {
  beforeEach(() => jest.clearAllMocks());

  it("never reports a failed upload as success", async () => {
    mockUpload.mockRejectedValue(new Error("storage 500"));
    await render(<ProfileImageScreen />);

    await choosePhoto();

    expect(await screen.findByText("Try again")).toBeTruthy();
    expect(screen.queryByText("Next")).toBeNull();
    expect(screen.queryByText(/Done!/)).toBeNull();
    expect(setProfileAvatar).not.toHaveBeenCalled();
  });

  it("retries with the same upload id", async () => {
    mockUpload.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce({ id: "m1" });
    setProfileAvatar.mockResolvedValue({ id: "u1", avatarUrl: "https://cdn/me.jpg" });
    await render(<ProfileImageScreen />);

    await choosePhoto();
    await press("Try again");
    await screen.findByText("Next");

    const [first, second] = mockUpload.mock.calls.map(([arg]) => arg.clientUploadId);
    expect(first).toBe(second);
  });

  it("assigns the completed upload as the avatar before allowing Next", async () => {
    mockUpload.mockResolvedValue({ id: "media-1" });
    const user = { id: "u1", avatarUrl: "https://cdn/me.jpg" };
    setProfileAvatar.mockResolvedValue(user);
    await render(<ProfileImageScreen />);

    await choosePhoto();
    await press("Next");

    expect(setProfileAvatar).toHaveBeenCalledWith(
      { mediaId: "media-1" },
      { sessionGeneration: expect.any(Number) },
    );
    expect(mockSetUser).toHaveBeenCalledWith(user, expect.objectContaining({ generation: expect.any(Number) }));
    expect(mockCompleteProfileSetup).toHaveBeenCalled();
  });

  it("does not offer Next when assigning the avatar fails", async () => {
    mockUpload.mockResolvedValue({ id: "media-1" });
    setProfileAvatar.mockRejectedValue(new Error("403"));
    await render(<ProfileImageScreen />);

    await choosePhoto();

    expect(await screen.findByText("Try again")).toBeTruthy();
    expect(screen.queryByText("Next")).toBeNull();
  });

  it("retries a failed avatar assignment with the same upload id", async () => {
    mockUpload.mockResolvedValue({ id: "media-1" });
    setProfileAvatar.mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce({ id: "u1" });
    await render(<ProfileImageScreen />);

    await choosePhoto();
    await press("Try again");
    await screen.findByText("Next");

    // Same id: the staged upload resumes from "completed" instead of transferring again.
    const [first, second] = mockUpload.mock.calls.map(([arg]) => arg.clientUploadId);
    expect(second).toBe(first);
    expect(setProfileAvatar).toHaveBeenCalledTimes(2);
  });

  it("stops before assigning the avatar if the session changed during the upload", async () => {
    let finishUpload!: (media: unknown) => void;
    mockUpload.mockReturnValue(new Promise((resolve) => (finishUpload = resolve)));
    await render(<ProfileImageScreen />);

    await choosePhoto();
    await act(() => TokenManager.setTokens({ accessToken: "B", refreshToken: "rB" }));
    await act(async () => finishUpload({ id: "media-1" }));

    expect(setProfileAvatar).not.toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
  });
});
