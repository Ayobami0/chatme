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
import * as Contacts from "expo-contacts";
import { useEffect, useRef, useState } from "react";
import { AppColor } from "@shared/theme/color";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DiscoveryService } from "@services/discovery";
import { formatPhoneNumber, validatePhoneNumber } from "@shared/utils/phone";
import { ConversationUser } from "@shared/types/models";
import { ConversationService } from "@services/conversation";
import { router } from "expo-router";

type ContactListModalProps = {
  onClose: () => void;
};

type AppContact = {
  id: string;
  displayName: string;
  phoneNumber?: string;
};

export function ContactListModal(props: ContactListModalProps) {
  const { onClose } = props;
  const [contacts, setContacts] = useState<AppContact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetching, setFetching] = useState(false);
  const {
    data: searchResults,
    isLoading: isSearching,
    refetch,
  } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: () => DiscoveryService.searchUsers(searchQuery),
    enabled: false,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutate } = useMutation({
    mutationFn: (numbers: string[]) =>
      DiscoveryService.matchContacts({ phoneNumbers: numbers }),
    onSuccess: ({ matches }) => {
      const hydratedContacts = contacts.map((c) => ({
        ...c,
        user: matches.find((m) => m.matchedPhoneNumber === c.phoneNumber)?.user,
      }));

      setContacts(hydratedContacts);
      setFetching(false);
    },
    onError: () => setFetching(false),
  });
  const searchUsers = (query: string) => {
    if (query.trim().length < 3) return;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      refetch();
    }, 1500);
  };
  const searchedContact = searchResults?.items ?? [];
  useEffect(() => {
    setFetching(true);
    async function fetchContacts() {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({ sort: "firstName" });
        const allContacts = data.map((c) => {
          const defaultPhone =
            c.phoneNumbers?.find((e) => e.isPrimary) ?? c.phoneNumbers?.[0];
          return {
            id: c.id,
            displayName: buildFullName(c),
            phoneNumber:
              formatPhoneNumber(defaultPhone?.number ?? "", {
                country: defaultPhone?.countryCode,
              }) ?? "",
          };
        });
        setContacts(allContacts);
        const phones = allContacts
          .slice(0, 101)
          .filter((c) => validatePhoneNumber(c.phoneNumber))
          .map((c) => c.phoneNumber) as string[];

        if (!phones.length) {
          setFetching(false);
          return;
        }
        mutate(phones);
      }
    }
    fetchContacts();
  }, []);

  const buildFullName = (c: Contacts.Contact) => {
    return `${c.firstName} ${c.lastName}`;
  };

  const filteredContacts = contacts.filter((c) =>
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View>
      <AppFullScreenModal visible={true} onClose={onClose} transparent>
        <View className="inset-0 absolute top-safe bg-background rounded-t-3xl pt-3 items-center">
          <View className="w-full relative flex-row justify-center items-center mt-7 mb-6">
            <AppText variant="h4">Contact</AppText>
            <Pressable
              className="absolute right-6 justify-center items-center"
              onPress={onClose}
            >
              <SolidXSvg />
            </Pressable>
          </View>
          <AppTextField
            surfix={isSearching ? () => <ActivityIndicator /> : undefined}
            placeholder="Search People"
            icon={({ isFocused }) => (
              <OutlineSearchSvg width={20} height={20} />
            )}
            className="mx-6"
            onChangeText={(v) => {
              setSearchQuery(v);
              searchUsers(v);
            }}
          />
          <FlatList
            style={{ width: "100%" }}
            contentContainerStyle={{ paddingVertical: 20 }}
            data={[...searchedContact, ...filteredContacts]}
            keyExtractor={(_, i) => i.toString()}
            ItemSeparatorComponent={() => <View className="h-4" />}
            renderItem={({ item, index }) => {
              const curr = item.displayName?.[0];
              const prev = contacts[index - 1]?.displayName?.[0];

              const isValidAlphabet = isAlphabet(curr);
              const hasSectionHeader =
                index === 0 ||
                (!isValidAlphabet && isAlphabet(prev)) ||
                (isValidAlphabet && curr !== prev);

              // @ts-ignore
              const isUser = searchedContact.includes(item);
              // @ts-ignore
              const avatarUrl = isUser ? item.avatarUrl : undefined;
              return (
                <View>
                  {searchQuery === "" && hasSectionHeader && (
                    <SectionHeader text={isValidAlphabet ? curr : "#"} />
                  )}
                  <ContactCard
                    item={item}
                    isUser={isUser}
                    avatarUrl={avatarUrl}
                  />
                </View>
              );
            }}
          />
        </View>
      </AppFullScreenModal>
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
  item,
  isUser,
  avatarUrl,
}: {
  item: AppContact | ConversationUser;
  isUser?: boolean;
  avatarUrl?: string;
}) {
  const buildInitials = () => {
    return item.displayName
      .split(" ")
      .map((name) => name.charAt(0).toUpperCase())
      .join("");
  };
  const { mutate: joinConversation } = useMutation({
    mutationFn: ConversationService.createOrUpdateConversation,
    onSuccess: (data) => {
    router.push({
      // @ts-ignore
      pathname: `/chat/${data.id}`,
      params: {
        activeAt: data.lastActivityAt ?? "",
        participantId: data.otherParticipant.id,
        displayName: encodeURIComponent(
          data.otherParticipant.displayName,
        ),
        profileUrl: encodeURIComponent(
          data.otherParticipant.avatarUrl,
        ),
      },
    })
    },
  });

  return (
    <Pressable
      className="flex-row gap-4 mx-6 items-center"
      onPress={isUser ? () => joinConversation(item.id) : undefined}
    >
      <View className="size-14 rounded-full bg-muted items-center justify-center">
        {!isUser || !avatarUrl ? (
          <AppText variant="body-sm-regular" color="subtext">
            {buildInitials()}
          </AppText>
        ) : (
          <Image
            source={{ uri: avatarUrl }}
            className="size-full rounded-full"
          />
        )}
      </View>
      <View className="flex-1">
        <AppText>{item.displayName}</AppText>
        {!isUser && (
          <AppText variant="body-sm-regular" color="subtext">
            {(item as AppContact).phoneNumber}
          </AppText>
        )}
      </View>
      {isUser ? (
        <OutlineCheveronRightSvg width={20} color={AppColor.neutral300} />
      ) : (
        <AddContactButton />
      )}
    </Pressable>
  );
}

function AddContactButton() {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="rounded-full bg-primary px-2 py-1 flex-row gap-2 items-center"
    >
      <OutlineAddUserSvg width={16} height={16} color={AppColor.white} />
      <AppText variant="body-sm-regular" color="onPrimary" size={10}>
        Invite
      </AppText>
    </TouchableOpacity>
  );
}

function isAlphabet(char?: string): boolean {
  return /^[a-zA-Z]$/.test(char ?? "");
}

function UserSearchResult({ users }: { users: ConversationUser[] }) {
  return (
    <View>
      <AppText>People</AppText>
      <FlatList
        data={users}
        renderItem={({ item }) => <ContactCard item={item} />}
      />
    </View>
  );
}
