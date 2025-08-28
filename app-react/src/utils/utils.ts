import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface User {
  _id: string;
  name: string;
  profile_picture: string | null;
  bio: string | null;
  profession: string | null;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
};

export function markdownToSnippet(markdown: string | undefined | null, length: number = 100): string {
  if (!markdown) {
    return "";
  }

  try {
    let plain = markdown
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#+\s+/gm, "")
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      .replace(/^>\s+/gm, "")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/\s+/g, " ")
      .trim();

    if (plain.length > length) {
      const lastSpaceIndex = plain.slice(0, length).lastIndexOf(" ");
      const cutoff = lastSpaceIndex > 0 ? lastSpaceIndex : length;
      plain = plain.slice(0, cutoff).trim() + "…";
    }

    return plain;
  } catch (error) {
    console.error("Error processing markdown snippet:", error);
    return markdown.length > length ? markdown.slice(0, length).trim() + "…" : markdown.trim();
  }
}

export function formatTimestampToDate(timestamp: string): string {
  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid timestamp provided");
  }

  const monthNames: string[] = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month: string = monthNames[date.getUTCMonth()];
  const day: number = date.getUTCDate();
  const year: number = date.getUTCFullYear();

  return `${month} ${day}, ${year}`;
}

export const getProfileImage = (user: User) => {
  return user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
};
