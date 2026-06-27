import { LivePlatform } from "@/generated/prisma/enums";

export function getYouTubeLiveEmbedUrl(videoId: string) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=0&rel=0`;
}

export function getVimeoEmbedUrl(rawUrl: string) {
  if (!rawUrl) return "";

  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "player.vimeo.com") return rawUrl;

    if (host === "vimeo.com") {
      const eventMatch = url.pathname.match(/^\/event\/(\d+)/);
      if (eventMatch?.[1]) return `https://vimeo.com/event/${eventMatch[1]}/embed`;

      const videoMatch = url.pathname.match(/^\/(\d+)/);
      if (videoMatch?.[1]) return `https://player.vimeo.com/video/${videoMatch[1]}`;
    }
  } catch {
    return "";
  }

  return "";
}

export function isVimeoUrl(rawUrl: string) {
  return Boolean(getVimeoEmbedUrl(rawUrl));
}

export function platformLabel(platform: LivePlatform | string) {
  switch (platform) {
    case LivePlatform.VIMEO_LIVE:
      return "Vimeo Live";
    case LivePlatform.GOOGLE_MEET:
      return "Google Meet";
    case LivePlatform.ZOOM_WEBINAR:
      return "Zoom Webinar";
    case LivePlatform.ZOOM_MEETING:
      return "Zoom Meeting";
    case LivePlatform.EXTERNAL_URL:
      return "外部直播連結";
    case LivePlatform.YOUTUBE_LIVE:
    default:
      return "YouTube Live";
  }
}

export function externalPlatformActionLabel(platform: LivePlatform | string) {
  switch (platform) {
    case LivePlatform.GOOGLE_MEET:
      return "進入 Google Meet 教室";
    case LivePlatform.ZOOM_WEBINAR:
      return "進入 Zoom Webinar";
    case LivePlatform.ZOOM_MEETING:
      return "進入 Zoom Meeting";
    case LivePlatform.EXTERNAL_URL:
      return "開啟外部直播";
    default:
      return "開啟直播";
  }
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const prefix = name.slice(0, Math.min(2, name.length));
  return `${prefix}${"*".repeat(Math.max(2, name.length - prefix.length))}@${domain}`;
}

export function liveWindowState({
  now,
  openAt,
  closeAt,
}: {
  now: Date;
  openAt: Date | null;
  closeAt: Date | null;
}) {
  if (openAt && now < openAt) return "NOT_OPEN" as const;
  if (closeAt && now > closeAt) return "CLOSED" as const;
  return "OPEN" as const;
}
