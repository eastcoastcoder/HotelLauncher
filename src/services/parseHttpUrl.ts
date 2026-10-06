export interface HttpUrlParts {
  host: string;
  path: string;
  query: Record<string, string>;
}

/** RN's URL type has no hostname or search params, so this stays on strings. */
export function parseHttpUrl(value: string): HttpUrlParts | null {
  const match = value
    .trim()
    .match(/^(https?):\/\/([^/?#]+)([^?#]*)(?:\?([^#]*))?/i);
  if (!match) {
    return null;
  }

  const host = match[2].replace(/^www\./i, '').split(':')[0].toLowerCase();
  const path = match[3] || '/';
  const query: Record<string, string> = {};
  if (match[4]) {
    for (const part of match[4].split('&')) {
      if (!part) {
        continue;
      }
      const eq = part.indexOf('=');
      const rawKey = eq === -1 ? part : part.slice(0, eq);
      const rawValue = eq === -1 ? '' : part.slice(eq + 1);
      try {
        const key = decodeURIComponent(rawKey);
        query[key] = decodeURIComponent(rawValue.replace(/\+/g, ' '));
      } catch {
        return null;
      }
    }
  }

  return { host, path, query };
}
