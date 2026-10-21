import {
  AppButton,
  AppFullScreenModal,
  AppText,
  AppTextField,
} from "@components";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import {
  OutlineCheckSvg,
  OutlineCheveronLeftSvg,
  OutlineSearchSvg,
  SolidAddAPhotoSvg,
} from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { AppColor } from "@shared/theme/color";
import { ConversationUser } from "@shared/types/models";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useCreateGroup, useSearchUsers } from "../query";
import { useUpload } from "@shared/hooks";
import { useDeviceContactMatches } from "../hooks/use-device-contact-matches";
import { openConversation } from "@features/chat/navigation";

type NewGroupModalProps = {
  isVisible: boolean;
  onClose: () => void;
};

export function NewGroupModal({ isVisible, onClose }: NewGroupModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<
    Array<{ id: string; displayName: string; avatarUrl?: string }>
  >([]);
  const [groupName, setGroupName] = useState("");
  const [image, setImage] = useState<string | undefined>();

  const createGroupMutation = useCreateGroup();
  const isCreating = createGroupMutation.isPending;
  const closeIconColor = useThemeColor("foreground");

  const resetState = () => {
    setStep(1);
    setSelectedUserIds([]);
    setSelectedUsers([]);
    setGroupName("");
    setImage(undefined);
  };
  const { upload, isPending } = useUpload({ purpose: "group_avatar" });

  const handleClose = () => {
    resetState();
    onClose();
  };

  const toggleSelectUser = (user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  }) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(user.id)) {
        setSelectedUsers((users) => users.filter((u) => u.id !== user.id));
        return prev.filter((id) => id !== user.id);
      } else {
        setSelectedUsers((users) => [...users, user]);
        return [...prev, user.id];
      }
    });
  };

  const createGroup = async () => {
    try {
      // The avatar is optional; only upload when one was picked.
      const avatar = image ? await upload(image) : undefined;
      const conversation = await createGroupMutation.mutateAsync({
        name: groupName.trim(),
        participantIds: selectedUserIds,
        avatarMediaId: avatar?.id,
      });
      handleClose();
      openConversation(conversation);
    } catch (error) {
      // Keep the form open with its input so the user can retry.
      Toast.show({
        type: "error",
        text1: "Unable to create group",
        text2: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <AppFullScreenModal
      transparent
      visible={isVisible}
      animationType="none"
      closeOnBackdropTap
      onClose={handleClose}
    >
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        enablePanDownToClose
        onClose={handleClose}
      >
        <BottomSheetView className="p-6 py-5">
          <View className="relative flex-row items-center justify-center mb-5">
            {step === 2 && (
              <Pressable
                onPress={() => setStep(1)}
                className="absolute left-0 p-1"
              >
                <OutlineCheveronLeftSvg
                  width={24}
                  height={24}
                  color={closeIconColor}
                />
              </Pressable>
            )}
            <AppText variant="h4" className="text-center">
              {step === 1 ? "Add participants" : "New Group"}
            </AppText>
          </View>

          <GroupCreationProgressIndicator step={step} />

          <View className="mt-6 mb-8">
            {step === 1 ? (
              <GroupCreationProgress1
                selectedUserIds={selectedUserIds}
                onToggleSelectUser={toggleSelectUser}
              />
            ) : (
              <GroupCreationProgress2
                groupName={groupName}
                setGroupName={setGroupName}
                selectedUsers={selectedUsers}
                image={image}
                setImage={setImage}
              />
            )}
          </View>

          {step === 1 ? (
            <AppButton
              disabled={selectedUserIds.length === 0}
              onPress={() => setStep(2)}
            >
              Next ({selectedUserIds.length})
            </AppButton>
          ) : (
            <AppButton
              isLoading={isCreating || isPending}
              disabled={
                groupName.trim().length === 0 || isCreating || isPending
              }
              onPress={() => createGroup()}
            >
              {isCreating || isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                "Create Group"
              )}
            </AppButton>
          )}
        </BottomSheetView>
      </BottomSheet>
    </AppFullScreenModal>
  );
}

function GroupCreationProgressIndicator({ step }: { step: 1 | 2 }) {
  return (
    <View className="flex-row gap-2">
      <View
        className={`h-[6] flex-1 rounded-full ${
          step >= 1 ? "bg-primary" : "bg-gray-200"
        }`}
      />
      <View
        className={`h-[6] flex-1 rounded-full ${
          step === 2 ? "bg-primary" : "bg-gray-200"
        }`}
      />
    </View>
  );
}

function GroupCreationProgress1({
  selectedUserIds,
  onToggleSelectUser,
}: {
  selectedUserIds: string[];
  onToggleSelectUser: (user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  }) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { contacts, status: contactsStatus, retry } = useDeviceContactMatches();
  const fetching = contactsStatus === "loading";

  const primaryColor = useThemeColor("primary");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsersQuery = useSearchUsers(searchQuery);
  const {
    data: searchResults,
    isLoading: isSearching,
    refetch,
  } = searchUsersQuery;

  const searchUsers = (query: string) => {
    if (query.trim().length < 3) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      refetch();
    }, 1000);
  };

  const matchedPhoneContacts = contacts
    .filter((c) => !!c.user)
    .map((c) => ({
      id: c.user!.id,
      displayName: c.displayName || c.user!.displayName || "User",
      avatarUrl: c.user!.avatarUrl ?? undefined,
    }));

  const searchedUsersList = (searchResults?.items ?? []).map(
    (u: ConversationUser) => ({
      id: u.id,
      displayName: u.displayName ?? "User",
      avatarUrl: u.avatarUrl ?? undefined,
    }),
  );

  const matchedUsersMap = new Map<
    string,
    { id: string; displayName: string; avatarUrl?: string }
  >();

  for (const u of [...searchedUsersList, ...matchedPhoneContacts]) {
    if (!matchedUsersMap.has(u.id)) {
      matchedUsersMap.set(u.id, u);
    }
  }

  const matchedUsers = Array.from(matchedUsersMap.values()).filter((u) =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View>
      <AppTextField
        surfix={
          isSearching ? () => <ActivityIndicator size="small" /> : undefined
        }
        placeholder="Search People"
        icon={({ isFocused }) => <OutlineSearchSvg width={20} height={20} />}
        onChangeText={(v) => {
          setSearchQuery(v);
          searchUsers(v);
        }}
      />

      <View className="mt-5 min-h-[110px]">
        {fetching || isSearching ? (
          <View className="py-6 items-center justify-center">
            <ActivityIndicator size="small" />
          </View>
        ) : matchedUsers.length === 0 ? (
          <View className="py-6 items-center justify-center gap-2">
            <AppText variant="body-sm-regular" color="subtext" className="text-center">
              {contactsStatus === "denied"
                ? "Allow access to contacts in Settings, or search for people by name."
                : "No matched contacts found"}
            </AppText>
            {contactsStatus === "error" && (
              <Pressable onPress={() => void retry()} accessibilityRole="button">
                <AppText variant="body-sm-medium" color="primary">
                  Try again
                </AppText>
              </Pressable>
            )}
          </View>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={matchedUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 16, paddingHorizontal: 4 }}
            renderItem={({ item }) => {
              const isSelected = selectedUserIds.includes(item.id);
              const initials = item.displayName
                .split(" ")
                .map((n) => n.charAt(0).toUpperCase())
                .join("");

              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onToggleSelectUser(item)}
                  className="items-center w-[72px]"
                >
                  <View>
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        padding: 2,
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: isSelected ? primaryColor : "transparent",
                      }}
                      className="items-center justify-center bg-muted overflow-hidden relative"
                    >
                      {item.avatarUrl ? (
                        <Image
                          source={{ uri: item.avatarUrl }}
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            borderRadius: 28,
                          }}
                        />
                      ) : (
                        <AppText variant="body-md-semibold" color="subtext">
                          {initials}
                        </AppText>
                      )}
                      {isSelected && (
                        <View className="size-full items-center justify-center">
                          <OutlineCheckSvg
                            width={24}
                            height={24}
                            color={AppColor.white}
                          />
                        </View>
                      )}
                    </View>
                  </View>

                  <AppText
                    variant="body-sm-medium"
                    numberOfLines={1}
                    className="text-center mt-2 w-[72px]"
                  >
                    {item.displayName}
                  </AppText>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

function GroupCreationProgress2({
  groupName,
  setGroupName,
  selectedUsers,
  image,
  setImage,
}: {
  groupName: string;
  setGroupName: (name: string) => void;
  selectedUsers: Array<{ id: string; displayName: string; avatarUrl?: string }>;
  image?: string;
  setImage: (image: string) => void;
}) {
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access the media library is required.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      selectionLimit: 1,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.assets === null || result.assets?.length === 0) return;

    setImage(result.assets![0].uri);
  };

  return (
    <View className="gap-5">
      <TouchableOpacity
        activeOpacity={0.8}
        className="size-32 bg-primary-50 items-center justify-center rounded-full self-center overflow-hidden"
        onPress={pickImage}
        accessibilityRole="button"
        accessibilityLabel={image ? "Change group photo" : "Add group photo"}
      >
        {image ? (
          <Image source={{ uri: image }} className="size-full" />
        ) : (
          <SolidAddAPhotoSvg
            width={48}
            height={48}
            color={AppColor.primary400}
          />
        )}
      </TouchableOpacity>
      <AppTextField
        placeholder="Name of group"
        label="Name of group"
        value={groupName}
        onChangeText={setGroupName}
      />

      <View>
        <AppText variant="body-md-semibold" color="subtext" className="mb-3">
          Participants ({selectedUsers.length})
        </AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16 }}
        >
          {selectedUsers.map((u) => {
            const initials = u.displayName
              .split(" ")
              .map((n) => n.charAt(0).toUpperCase())
              .join("");
            return (
              <View key={u.id} className="items-center w-[64px]">
                <View
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  className="items-center justify-center bg-muted overflow-hidden"
                >
                  {u.avatarUrl ? (
                    <Image
                      source={{ uri: u.avatarUrl }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 24,
                      }}
                    />
                  ) : (
                    <AppText variant="body-sm-semibold" color="subtext">
                      {initials}
                    </AppText>
                  )}
                </View>
                <AppText
                  variant="body-sm-regular"
                  numberOfLines={1}
                  className="text-center mt-1 w-[64px]"
                >
                  {u.displayName}
                </AppText>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
