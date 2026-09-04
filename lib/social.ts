import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";

export type SocialLinks = {
  instagram: string;
  facebook: string;
  tiktok: string;
};

export const SOCIAL_SETTING_KEYS = {
  instagram: "social.instagram",
  facebook: "social.facebook",
  tiktok: "social.tiktok",
} as const;

function safePublicUrl(value: string | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export async function getSocialLinks(): Promise<SocialLinks> {
  const rows = await getDb()
    .select({ key: settings.key, value: settings.value })
    .from(settings)
    .where(inArray(settings.key, Object.values(SOCIAL_SETTING_KEYS)));

  const values = new Map(rows.map((row) => [row.key, row.value]));
  return {
    instagram: safePublicUrl(values.get(SOCIAL_SETTING_KEYS.instagram)),
    facebook: safePublicUrl(values.get(SOCIAL_SETTING_KEYS.facebook)),
    tiktok: safePublicUrl(values.get(SOCIAL_SETTING_KEYS.tiktok)),
  };
}
