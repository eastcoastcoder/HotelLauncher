import {
  isYouTubeVideoId,
  MainStageMediaConfig,
} from '../config/mainStageMedia';
import { parseHttpUrl } from './parseHttpUrl';

const CHANNEL_ID = /^UC[\w-]{22}$/;
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  // Skips the consent interstitial so the videos page still contains ids.
  Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+000',
};

let playlistCache: { key: string; ids: string[] } | null = null;

export function channelVideosPageUrl(channel: string): string | null {
  const trimmed = channel.trim();
  if (!trimmed) {
    return null;
  }

  if (CHANNEL_ID.test(trimmed)) {
    return `https://www.youtube.com/channel/${trimmed}/videos`;
  }

  const handleOnly = trimmed.match(/^@([\w.-]+)$/);
  if (handleOnly) {
    return `https://www.youtube.com/@${handleOnly[1]}/videos`;
  }

  const url = parseHttpUrl(trimmed);
  if (!url) {
    return null;
  }
  if (url.host !== 'youtube.com' && url.host !== 'm.youtube.com') {
    return null;
  }

  const handle = url.path.match(/^\/@([\w.-]+)/);
  if (handle) {
    return `https://www.youtube.com/@${handle[1]}/videos`;
  }

  const channelId = url.path.match(/^\/channel\/(UC[\w-]{22})/);
  if (channelId) {
    return `https://www.youtube.com/channel/${channelId[1]}/videos`;
  }

  return null;
}

export function videoIdsFromChannelHtml(html: string): string[] {
  const fromContentIds = uniqueVideoIds(
    html,
    /"contentId":"([A-Za-z0-9_-]{11})"/g,
  );
  if (fromContentIds.length > 0) {
    return fromContentIds;
  }
  return uniqueVideoIds(html, /\/watch\?v=([A-Za-z0-9_-]{11})/g);
}

function uniqueVideoIds(html: string, pattern: RegExp): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(pattern)) {
    const id = match[1];
    if (!seen.has(id) && isYouTubeVideoId(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

export function filterExcludedVideoIds(
  ids: readonly string[],
  exclude: readonly string[],
): string[] {
  const skip = new Set(exclude);
  return ids.filter(id => isYouTubeVideoId(id) && !skip.has(id));
}

export async function loadChannelVideoIds(
  config: MainStageMediaConfig,
  signal?: AbortSignal,
): Promise<string[]> {
  const pageUrl = channelVideosPageUrl(config.channel);
  if (!pageUrl) {
    return [];
  }

  const key = `${pageUrl}\n${config.exclude.join(',')}`;
  if (playlistCache?.key === key) {
    return playlistCache.ids;
  }

  const response = await fetch(pageUrl, {
    headers: BROWSER_HEADERS,
    signal,
  });
  if (!response.ok) {
    throw new Error(`YouTube channel request failed (${response.status})`);
  }

  const ids = filterExcludedVideoIds(
    videoIdsFromChannelHtml(await response.text()),
    config.exclude,
  );
  playlistCache = { key, ids };
  return ids;
}
