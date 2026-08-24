import { AppFullScreenModal, AppText, AppTextField } from "@components";
import {
  OutlineAddUserSvg,
  OutlineCheveronRightSvg,
  OutlineSearchSvg,
  SolidXSvg,
} from "@shared/components/svgs/icons";
import { FlatList, Image, Pressable, TouchableOpacity, View } from "react-native";
import * as Contacts from "expo-contacts";
import { useEffect, useState } from "react";
import { AppColor } from "@shared/theme/color";
import { useMutation } from "@tanstack/react-query";
import { DiscoveryService } from "@services/discovery";
import { formatPhoneNumber, validatePhoneNumber } from "@shared/utils/phone";
import { ConversationUser } from "@shared/types/models";

type ContactListModalProps = {
  onClose: () => void;
};

type AppContact = {
  id: string;
  fullName: string;
  phone: string;
  user?: ConversationUser;
};

export function ContactListModal(props: ContactListModalProps) {
  const { onClose } = props;
  const [contacts, setContacts] = useState<AppContact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetching, setFetching] = useState(false);
  const { mutate } = useMutation({
    mutationFn: (numbers: string[]) =>
      DiscoveryService.matchContacts({ phoneNumbers: numbers }),
    onSuccess: ({ matches }) => {
      const hydratedContacts = contacts.map((c) => ({
        ...c,
        user: matches.find((m) => m.matchedPhoneNumber === c.phone)?.user,
      }));

      setContacts(hydratedContacts);
      setFetching(false);
    },
    onError: () => setFetching(false),
  });

  useEffect(() => {
    setFetching(true);
    async function fetchContacts() {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({ sort: "firstName" });
        const allContacts = data.map((c) => {
          const contact = c;
          const defaultPhone =
            c.phoneNumbers?.find((e) => e.isPrimary) ?? c.phoneNumbers?.[0];
          return {
            id: c.id,
            fullName: buildFullName(c),
            phone:
              formatPhoneNumber(defaultPhone?.number ?? "", {
                country: defaultPhone?.countryCode,
              }) ?? "",
          };
        });
        setContacts(allContacts);
        const phones = allContacts
          .filter((c) => validatePhoneNumber(c.phone))
          .map((c) => c.phone) as string[];

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
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
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
            placeholder="Search People"
            icon={({ isFocused }) => <OutlineSearchSvg />}
            className="mx-6"
            onChangeText={(v) => {
              setSearchQuery(v);
            }}
          />
          <FlatList
            style={{ width: "100%" }}
            contentContainerStyle={{ paddingVertical: 20 }}
            data={filteredContacts}
            keyExtractor={(_, i) => i.toString()}
            ItemSeparatorComponent={() => <View className="h-4" />}
            renderItem={({ item, index }) => {
              const curr = item.fullName?.[0];
              const prev = contacts[index - 1]?.fullName?.[0];

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
                  <ContactCard item={item}/>
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

function ContactCard({ item }: { item: AppContact }) {
  const buildInitials = () => {
    return item.fullName
      .split(" ")
      .map((name) => name.charAt(0).toUpperCase())
      .join("");
  };
  return (
    <View className="flex-row gap-4 mx-6 items-center">
      <View className="size-14 rounded-full bg-muted items-center justify-center">
        {!item.user || !item.user.avatarUrl ? (
          <AppText variant="body-sm-regular" color="subtext">
            {buildInitials()}
          </AppText>
        ) : (
          <Image
            source={{ uri: item.user.avatarUrl }}
            className="size-full rounded-full"
          />
        )}
      </View>
      <View className="flex-1">
        <AppText>{item.fullName}</AppText>
        <AppText variant="body-sm-regular" color="subtext">
          {item.phone}
        </AppText>
      </View>
      {item.user ? (
        <OutlineCheveronRightSvg width={20} color={AppColor.neutral300} />
      ) : (
        <AddContactButton />
      )}
    </View>
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
