import { parseHttpUrl } from '../services/parseHttpUrl';

export interface MainStageMediaConfig {
  /** YouTube channel URL, @handle, or channel id. Blank keeps the static stage. */
  channel: string;
  /** Video ids to skip. A watch URL is accepted and reduced to its id. */
  exclude: string[];
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const EMPTY_MAIN_STAGE_MEDIA: MainStageMediaConfig = {
  channel: '',
  exclude: [],
};

let cached: MainStageMediaConfig | null = null;

export function isYouTubeVideoId(value: string): boolean {
  return VIDEO_ID.test(value);
}

export function videoIdFromInput(value: string): string | null {
  const trimmed = value.trim();
  if (isYouTubeVideoId(trimmed)) {
    return trimmed;
  }

  const url = parseHttpUrl(trimmed);
  if (!url) {
    return null;
  }

  const fromQuery = url.query.v;
  if (fromQuery && isYouTubeVideoId(fromQuery)) {
    return fromQuery;
  }
  const fromPath = url.path.match(
    /\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/,
  );
  if (fromPath) {
    return fromPath[1];
  }
  if (url.host === 'youtu.be') {
    const id = url.path.split('/').filter(Boolean)[0];
    if (id && isYouTubeVideoId(id)) {
      return id;
    }
  }

  return null;
}

export function normalizeMainStageMediaConfig(
  value: unknown,
): MainStageMediaConfig {
  if (value == null || typeof value !== 'object') {
    return EMPTY_MAIN_STAGE_MEDIA;
  }

  const record = value as Record<string, unknown>;
  const channel =
    typeof record.channel === 'string' ? record.channel.trim() : '';
  const exclude: string[] = [];
  if (Array.isArray(record.exclude)) {
    for (const entry of record.exclude) {
      if (typeof entry !== 'string') {
        continue;
      }
      const id = videoIdFromInput(entry);
      if (id && !exclude.includes(id)) {
        exclude.push(id);
      }
    }
  }

  return { channel, exclude };
}

function readRawMainStageMedia(): unknown {
  try {
    // Metro serves the example file when this gitignored override is missing.
    return require('./mainStage.local.json') as unknown;
  } catch {
    return require('./mainStage.example.json') as unknown;
  }
}

/**
 * Local override for the Discover stage.
 * A later settings screen should pass MainStageMediaConfig in instead of
 * reading this file. The file is gitignored so a property's channel stays
 * off the repo; with nothing set, the stage stays on its static layout.
 */
export function loadMainStageMediaConfig(): MainStageMediaConfig {
  if (cached == null) {
    cached = normalizeMainStageMediaConfig(readRawMainStageMedia());
  }
  return cached;
}
