import { isYouTubeVideoId } from '../config/mainStageMedia';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+000',
};

export type YouTubeVideoDetails = {
  title: string;
  description: string;
};

const detailsCache = new Map<string, YouTubeVideoDetails>();

export function videoDetailsFromWatchHtml(html: string): YouTubeVideoDetails {
  const details = jsonObjectAfter(html, '"videoDetails"');
  if (!details || typeof details !== 'object') {
    return { title: '', description: '' };
  }
  const record = details as { title?: unknown; shortDescription?: unknown };
  return {
    title: typeof record.title === 'string' ? record.title : '',
    description:
      typeof record.shortDescription === 'string'
        ? record.shortDescription
        : '',
  };
}

export async function loadYouTubeVideoDetails(
  videoId: string,
  signal?: AbortSignal,
): Promise<YouTubeVideoDetails> {
  if (!isYouTubeVideoId(videoId)) {
    return { title: '', description: '' };
  }
  const cached = detailsCache.get(videoId);
  if (cached) {
    return cached;
  }

  const response = await fetch(
    `https://www.youtube.com/watch?v=${videoId}`,
    { headers: BROWSER_HEADERS, signal },
  );
  if (!response.ok) {
    throw new Error(`YouTube video request failed (${response.status})`);
  }

  const details = videoDetailsFromWatchHtml(await response.text());
  if (details.title !== '' || details.description !== '') {
    detailsCache.set(videoId, details);
  }
  return details;
}

function jsonObjectAfter(html: string, marker: string): unknown | null {
  const markerAt = html.indexOf(marker);
  if (markerAt < 0) {
    return null;
  }
  const start = html.indexOf('{', markerAt + marker.length);
  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch !== '}') {
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      try {
        return JSON.parse(html.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}
