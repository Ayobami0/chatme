import { AppMediaAction, AppMediaUpload } from "@shared/components/app-media-upload";
import { toast } from "@shared/components/app-toast";
import {
  OutlinePaperClipSvg,
  SolidPaperAirplaneSvg,
  SolidPhotographSvg,
  SolidXCircleSvg,
} from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { AppColor } from "@shared/theme/color";
import {
  PickedImage,
  prepareImageForUpload,
  UnsupportedMediaError,
} from "@shared/utils/media-file";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { useDraftsStore } from "../store/drafts";
import { OutboxAttachment } from "../store/outbox";
import { canSendMessage, MAX_MESSAGE_LENGTH } from "../utils/can-send-message";

/**
 * The chat composer: a per-conversation draft (persisted), photo attachments and Send.
 * Send stays disabled until `canSendMessage` accepts the draft and photos are ready.
 */
export function MessageComposer(props: {
  conversationId: string;
  onSend: (text: string, attachments: OutboxAttachment[]) => void;
  onTyping: () => void;
  onBlur: () => void;
}) {
  const { conversationId } = props;
  const text = useDraftsStore((s) => s.drafts[conversationId] ?? "");
  const setDraft = useDraftsStore((s) => s.setDraft);
  const clipIconColor = useThemeColor("subtext");
  const sendIconColor = useThemeColor("primary-foreground");
  const placeholderColor = useThemeColor("placeholder");
  const [showMediaSelection, setShowMediaSelection] = useState(false);
  const [attachments, setAttachments] = useState<OutboxAttachment[]>([]);
  const [isPreparing, setIsPreparing] = useState(false);
  const canSend = canSendMessage({ text, attachmentCount: attachments.length }) && !isPreparing;

  const addImages = async (images: PickedImage[]) => {
    setShowMediaSelection(false);
    setIsPreparing(true);
    try {
      const prepared = await Promise.all(images.map(prepareImageForUpload));
      setAttachments((current) => [
        ...current,
        ...prepared.map((file) => ({
          type: "image" as const,
          localUri: file.uri,
          sizeBytes: file.sizeBytes,
          fileName: file.fileName,
          contentType: file.contentType,
          clientUploadId: Crypto.randomUUID(),
        })),
      ]);
    } catch (error) {
      toast.show({
        type: "error",
        text1: "Couldn't add photo",
        text2:
          error instanceof UnsupportedMediaError
            ? error.message
            : "This photo format isn't supported.",
      });
    } finally {
      setIsPreparing(false);
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Allow access to your photos in Settings to send pictures.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ],
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });
    if (!result.canceled) void addImages(result.assets);
  };

  const send = () => {
    if (!canSend) return;
    props.onSend(text.trim(), attachments);
    setDraft(conversationId, "");
    setAttachments([]);
  };

  return (
    <View className="gap-2">
      {attachments.length > 0 && (
        <FlatList
          horizontal
          contentContainerStyle={{ flexGrow: 1 }}
          showsHorizontalScrollIndicator={false}
          data={attachments}
          keyExtractor={(item) => item.localUri}
          ItemSeparatorComponent={() => <View className="w-2" />}
          renderItem={({ item, index }) => {
            return (
              <View
                className={`size-16 overflow-hidden rounded-lg ${index === 0 ? "ml-2" : ""} ${index === attachments.length - 1 ? "mr-2" : ""}`}
              >
                <AttachmentCard
                  attachment={item}
                  onRemove={() => {
                    setAttachments((a) => a.filter((other) => other !== item));
                  }}
                />
              </View>
            );
          }}
        />
      )}
      {showMediaSelection && (
        <View className="mx-6">
          {/* Documents are hidden until non-image attachments are supported end to end. */}
          <AppMediaUpload
            showRecentImage
            onRecentImagePicked={(uri, data) => {
              if (uri) void addImages([{ uri, fileName: data?.filename }]);
            }}
          >
            <AppMediaAction
              icon={SolidPhotographSvg}
              label="Photo or Gallery"
              onPress={() => void pickFromLibrary()}
            />
          </AppMediaUpload>
        </View>
      )}
      <View
        style={{
          shadowColor: "#274431",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.02,
          shadowRadius: 24,
          elevation: 2,
        }}
        className="bg-background gap-3 py-4 px-3 flex-row items-center mx-6 mb-5 rounded-full"
      >
        <Pressable
          onPress={() => {
            setShowMediaSelection(!showMediaSelection);
          }}
          className="rounded-full size-10 items-center justify-center bg-surface"
          accessibilityRole="button"
          accessibilityLabel="Add attachment"
          accessibilityState={{ expanded: showMediaSelection }}
        >
          {isPreparing ? (
            <ActivityIndicator />
          ) : (
            <OutlinePaperClipSvg width={24} height={24} color={clipIconColor} />
          )}
        </Pressable>
        <TextInput
          className="flex-1 text-title"
          value={text}
          onChangeText={(value) => {
            setDraft(conversationId, value);
            if (value) props.onTyping();
            else props.onBlur();
          }}
          onBlur={props.onBlur}
          accessibilityLabel="Message"
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Start typing..."
          placeholderTextColor={placeholderColor}
        />
        <Pressable
          className={`size-10 rounded-full bg-primary items-center justify-center ${canSend ? "" : "opacity-50"}`}
          disabled={!canSend}
          onPress={send}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !canSend }}
        >
          <SolidPaperAirplaneSvg color={sendIconColor} />
        </Pressable>
      </View>
    </View>
  );
}

const AttachmentCard = ({
  attachment,
  onRemove,
}: {
  attachment: OutboxAttachment;
  onRemove: () => void;
}) => {
  return (
    <View className="relative size-16 overflow-visible">
      <Pressable
        onPress={onRemove}
        style={{ position: "absolute", top: -5, right: -5, zIndex: 1 }}
        accessibilityRole="button"
        accessibilityLabel="Remove attachment"
        hitSlop={8}
      >
        <SolidXCircleSvg color={AppColor.danger} />
      </Pressable>

      <View className="size-full overflow-hidden rounded-lg">
        <Image
          source={{ uri: attachment.localUri }}
          style={{ width: "100%", height: "100%" }}
        />
      </View>
    </View>
  );
};
