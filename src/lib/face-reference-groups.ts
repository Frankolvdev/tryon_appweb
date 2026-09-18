export const FACE_REFERENCE_GROUPS = [
  "east_asian", "southeast_asian", "south_central_asian",
  "middle_eastern_north_african", "african_afrodescendant",
  "european", "latin_caribbean", "mixed_pacific",
] as const;

export type FaceReferenceGroup = typeof FACE_REFERENCE_GROUPS[number];

const GROUP_COUNTRY_CODES: Record<Exclude<FaceReferenceGroup, "mixed_pacific">, readonly string[]> = {
  east_asian: ["CN", "HK", "JP", "KP", "KR", "MO", "MN", "TW"],
  southeast_asian: ["BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "TL", "VN"],
  south_central_asian: ["AF", "BD", "BT", "IN", "KZ", "KG", "MV", "NP", "PK", "LK", "TJ", "TM", "UZ"],
  middle_eastern_north_african: [
    "AE", "AM", "AZ", "BH", "DZ", "EG", "EH", "GE", "IL", "IQ", "IR", "JO", "KW", "LB",
    "LY", "MA", "MR", "OM", "PS", "QA", "SA", "SY", "TN", "TR", "YE",
  ],
  african_afrodescendant: [
    "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ", "ER", "ET",
    "GA", "GH", "GM", "GN", "GQ", "GW", "HT", "KE", "KM", "LR", "LS", "MG", "ML", "MU",
    "MW", "MZ", "NA", "NE", "NG", "RE", "RW", "SC", "SD", "SH", "SL", "SN", "SO", "SS", "ST",
    "SZ", "TD", "TG", "TZ", "UG", "YT", "ZA", "ZM", "ZW",
  ],
  european: [
    "AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK", "EE",
    "ES", "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU", "IE", "IM", "IS", "IT",
    "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT",
    "RO", "RS", "RU", "SE", "SI", "SJ", "SK", "SM", "UA", "VA",
  ],
  latin_caribbean: [
    "AG", "AI", "AR", "AW", "BB", "BL", "BO", "BQ", "BR", "BS", "BZ", "CL", "CO", "CR",
    "CU", "CW", "DM", "DO", "EC", "FK", "GF", "GD", "GP", "GT", "GY", "HN", "JM", "KN",
    "KY", "LC", "MF", "MQ", "MS", "MX", "NI", "PA", "PE", "PM", "PR", "PY", "SR", "SV", "SX",
    "TC", "TT", "UY", "VC", "VE", "VG", "VI",
  ],
};

const COUNTRY_GROUP = new Map<string, FaceReferenceGroup>(
  Object.entries(GROUP_COUNTRY_CODES).flatMap(([group, codes]) =>
    codes.map((code) => [code, group as FaceReferenceGroup] as const),
  ),
);

export function resolveFaceReferenceGroup(countryCode?: string | null, displayName?: string | null): FaceReferenceGroup {
  const code = (countryCode || "").trim().toUpperCase();
  if (code) return COUNTRY_GROUP.get(code) || "mixed_pacific";
  const name = (displayName || "").trim().toLowerCase();
  if (/afric|afro|congo|hait/i.test(name)) return "african_afrodescendant";
  if (/korea|japan|china|taiwan|mongol|hong kong|macao|macau/i.test(name)) return "east_asian";
  if (/thai|vietnam|filip|indones|malay|cambod|lao|myanmar|singapore|brunei|timor/i.test(name)) return "southeast_asian";
  if (/india|pakistan|bangladesh|sri lanka|nepal|bhutan|maldiv|afghan|kazakh|kyrgyz|tajik|turkmen|uzbek/i.test(name)) return "south_central_asian";
  if (/arab|middle east|persian|iran|turk|morocc|egypt|alger|tunis|libya|palestin|israel/i.test(name)) return "middle_eastern_north_african";
  if (/latin|mexic|brazil|venezuel|colombi|argentin|caribbean/i.test(name)) return "latin_caribbean";
  if (/europe|russian|ukrain|italian|spanish|french|german|british/i.test(name)) return "european";
  return "mixed_pacific";
}
