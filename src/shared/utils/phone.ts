import parsePhoneNumber, { CountryCode, PhoneNumber } from "libphonenumber-js";

export function formatPhoneNumber(
  phoneNumber: string,
  opt?: { country?: string },
): string | undefined {
  console.log(phoneNumber, opt);
  const parsed = parsePhoneNumber(phoneNumber, {
    defaultCountry: opt?.country?.toUpperCase() as CountryCode | undefined,
  });

  console.log(parsed);
  if (!parsed) {
    return undefined;
  }

  return parsed.format("E.164");
}

export function validatePhoneNumber(
  phoneNumber: string,
  options?: { country?: string },
): boolean {
  return (
    parsePhoneNumber(phoneNumber, {
      defaultCountry: options?.country?.toUpperCase() as
        CountryCode | undefined,
    })?.isValid() ?? false
  );
}
