import { AppFullScreenModal, AppText, AppTextField } from "@components";
import {
  OutlineAddUserSvg,
  OutlineCheveronRightSvg,
  OutlineSearchSvg,
  SolidXSvg,
} from "@shared/components/svgs/icons";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import { useRef, useState } from "react";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { useSearchUsers, useCreateDirectConversation } from "../query";
import {
  ContactMatchStatus,
  useDeviceContactMatches,
} from "../hooks/use-device-contact-matches";
import { DeviceContact } from "../utils/contact-matching";
import { openConversation } from "@features/chat/navigation";
import { ConversationUser } from "@shared/types/models";

type ContactListModalProps = {
  onClose: () => void;
};

type ContactRow =
  | { kind: "user"; key: string; user: ConversationUser; label: string }
  | { kind: "contact"; key: string; contact: DeviceContact };

const rowName = (row: ContactRow) =>
  row.kind === "user" ? row.label : row.contact.displayName;

export function ContactListModal(props: ContactListModalProps) {
  const { onClose } = props;
  const closeIconColor = useThemeColor("foreground");
  const [searchQuery, setSearchQuery] = useState("");
  const { contacts, status, retry } = useDeviceContactMatches();
  const searchUsersQuery = useSearchUsers(searchQuery);
  const {
    data: searchResults,
    isLoading: isSearching,
    refetch,
  } = searchUsersQuery;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchUsers = (query: string) => {
    if (query.trim().length < 3) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      refetch();
    }, 1500);
  };

  const query = searchQuery.toLowerCase();
  const searchRows: ContactRow[] = (searchResults?.items ?? []).map((user) => ({
    kind: "user",
    key: `search:${user.id}`,
    user,
    label: user.displayName ?? "User",
  }));
  // Matched contacts open a chat with their server user; the rest can be invited.
  const contactRows: ContactRow[] = contacts
    .filter((c) => c.displayName.toLowerCase().includes(query))
    .map((contact) =>
      contact.user
        ? {
            kind: "user",
            key: `contact:${contact.deviceContactId}`,
            user: contact.user,
            label: contact.displayName || contact.user.displayName || "User",
          }
        : { kind: "contact", key: `contact:${contact.deviceContactId}`, contact },
    );
  const rows = [...searchRows, ...contactRows];

  return (
    <View>
      <AppFullScreenModal visible={true} onClose={onClose} transparent>
        <View className="inset-0 absolute top-safe bg-background rounded-t-3xl pt-3 items-center">
          <View className="w-full relative flex-row justify-center items-center mt-7 mb-6">
            <AppText variant="h4">Contact</AppText>
            <Pressable
              className="absolute right-6 justify-center items-center"
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <SolidXSvg color={closeIconColor} />
            </Pressable>
          </View>
          <AppTextField
            surfix={isSearching ? () => <ActivityIndicator /> : undefined}
            placeholder="Search People"
            icon={() => <OutlineSearchSvg width={20} height={20} />}
            className="mx-6"
            onChangeText={(v) => {
              setSearchQuery(v);
              searchUsers(v);
            }}
          />
          <FlatList
            style={{ width: "100%" }}
            contentContainerStyle={{ paddingVertical: 20 }}
            data={rows}
            keyExtractor={(row) => row.key}
            ItemSeparatorComponent={() => <View className="h-4" />}
            ListHeaderComponent={
              <ContactsStatus status={status} onRetry={() => void retry()} />
            }
            renderItem={({ item, index }) => {
              const curr = rowName(item)?.[0];
              const prev = index > 0 ? rowName(rows[index - 1])?.[0] : undefined;

              const isValidAlphabet = isAlphabet(curr);
              const hasSectionHeader =
                index === 0 ||
                (!isValidAlphabet && isAlphabet(prev)) ||
                (isValidAlphabet && curr !== prev);

              return (
                <View>
                  {searchQuery === "" && hasSectionHeader && (
                    <SectionHeader text={isValidAlphabet ? curr : "#"} />
                  )}
                  <ContactCard row={item} onClose={onClose} />
                </View>
              );
            }}
          />
        </View>
      </AppFullScreenModal>
    </View>
  );
}

function ContactsStatus({
  status,
  onRetry,
}: {
  status: ContactMatchStatus;
  onRetry: () => void;
}) {
  if (status === "ready") return null;
  if (status === "loading") {
    return <ActivityIndicator className="py-4" />;
  }

  return (
    <View className="mx-6 mb-4 gap-2 items-center">
      <AppText variant="body-sm-regular" color="subtext" className="text-center">
        {status === "denied"
          ? "Allow access to contacts in Settings to find friends on ChatMe."
          : "Some contacts couldn't be checked."}
      </AppText>
      {status === "error" && (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <AppText variant="body-sm-medium" color="primary">
            Try again
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

function SectionHeader({ text }: { text?: string }) {
  return (
    <View className="h-8 justify-center px-6 bg-muted mb-4">
      <AppText>{text}</AppText>
    </View>
  );
}

function ContactCard({
  row,
  onClose,
}: {
  row: ContactRow;
  onClose?: () => void;
}) {
  const subtextColor = useThemeColor("subtext");
  const isUser = row.kind === "user";
  const name = rowName(row);
  const avatarUrl = isUser ? row.user.avatarUrl : null;
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const createDirectConversationMutation = useCreateDirectConversation();
  const startChat = (userId: string) => {
    createDirectConversationMutation.mutate(userId, {
      onSuccess: (conversation) => {
        openConversation(conversation);
        onClose?.();
      },
    });
  };

  return (
    <Pressable
      className="flex-row gap-4 mx-6 items-center"
      onPress={isUser ? () => startChat(row.user.id) : undefined}
      disabled={!isUser || createDirectConversationMutation.isPending}
      accessibilityRole={isUser ? "button" : undefined}
      accessibilityLabel={isUser ? `Chat with ${name}` : undefined}
    >
      <View className="size-14 rounded-full bg-muted items-center justify-center">
        {!avatarUrl ? (
          <AppText variant="body-sm-regular" color="subtext">
            {initials}
          </AppText>
        ) : (
          <Image
            source={{ uri: avatarUrl }}
            className="size-full rounded-full"
          />
        )}
      </View>
      <View className="flex-1">
        <AppText>{name}</AppText>
        {!isUser && (
          <AppText variant="body-sm-regular" color="subtext">
            {row.contact.phoneNumber}
          </AppText>
        )}
      </View>
      {isUser ? (
        <OutlineCheveronRightSvg width={20} color={subtextColor} />
      ) : (
        <AddContactButton />
      )}
    </Pressable>
  );
}

function AddContactButton() {
  const iconColor = useThemeColor("primary-foreground");
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="rounded-full bg-primary px-2 py-1 flex-row gap-2 items-center"
    >
      <OutlineAddUserSvg width={16} height={16} color={iconColor} />
      <AppText variant="body-sm-regular" color="onPrimary" size={10}>
        Invite
      </AppText>
    </TouchableOpacity>
  );
}

function isAlphabet(char?: string): boolean {
  return /^[a-zA-Z]$/.test(char ?? "");
}
