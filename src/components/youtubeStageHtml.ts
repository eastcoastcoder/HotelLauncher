import { isYouTubeVideoId } from '../config/mainStageMedia';
import { parseHttpUrl } from '../services/parseHttpUrl';

/** Referer origin YouTube requires from an embedded player. Matches the app id. */
export const STAGE_EMBED_ORIGIN = 'https://com.hotellauncher';

const ALLOWED_HOST_SUFFIXES = [
  'com.hotellauncher',
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'googlevideo.com',
  'ytimg.com',
  'ggpht.com',
  'google.com',
  'gstatic.com',
  'googleapis.com',
  'googleusercontent.com',
];

export function isStageRequestAllowed(url: string): boolean {
  if (
    url.startsWith('about:') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return true;
  }

  const parsed = parseHttpUrl(url);
  if (!parsed) {
    return false;
  }
  const host = parsed.host;

  return ALLOWED_HOST_SUFFIXES.some(
    domain => host === domain || host.endsWith(`.${domain}`),
  );
}

/**
 * One page that streams the channel. The list is shuffled, then each video
 * plays through. Nothing is downloaded ahead of time.
 * The document is locked to the viewport so the WebView cannot scroll.
 */
export function buildYouTubeStageHtml(videoIds: readonly string[]): string {
  const ids = videoIds.filter(isYouTubeVideoId);
  if (ids.length === 0) {
    throw new Error('No playable YouTube video ids');
  }

  const payload = JSON.stringify(ids).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        background: #000;
        overflow: hidden;
        position: fixed;
        left: 0;
        top: 0;
        touch-action: none;
      }
      /* Clip the covered player. The page itself stays viewport-sized. */
      #clip {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      iframe {
        position: absolute;
        border: 0;
        pointer-events: none;
      }
    </style>
  </head>
  <body>
    <div id="clip">
      <div id="player"></div>
    </div>
    <script>
      var ids = ${payload};
      var index = 0;
      var failures = 0;
      var player = null;
      var watch = null;
      var wantMuted = true;
      function shuffle(list) {
        for (var i = list.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var swap = list[i];
          list[i] = list[j];
          list[j] = swap;
        }
      }
      shuffle(ids);
      function post(message) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(message);
        }
      }
      function clearWatch() {
        if (watch) {
          clearTimeout(watch);
          watch = null;
        }
      }
      function arm() {
        clearWatch();
        watch = setTimeout(function () {
          failures += 1;
          advance();
        }, 45000);
      }
      function applyAudio() {
        if (!player || !player.mute) {
          return;
        }
        if (wantMuted) {
          player.mute();
        } else {
          player.unMute();
          player.setVolume(100);
        }
      }
      function setStageMuted(muted) {
        wantMuted = !!muted;
        applyAudio();
      }
      window.setStageMuted = setStageMuted;
      function fit() {
        var root = document.documentElement;
        if (root) {
          root.style.overflow = 'hidden';
          root.scrollTop = 0;
        }
        if (document.body) {
          document.body.style.overflow = 'hidden';
          document.body.scrollTop = 0;
        }
        window.scrollTo(0, 0);
        if (!player || !player.getIframe) {
          return;
        }
        var width = window.innerWidth || root.clientWidth;
        var height = window.innerHeight || root.clientHeight;
        if (!width || !height) {
          return;
        }
        var coverW = width;
        var coverH = Math.round((width * 9) / 16);
        if (coverH < height) {
          coverH = height;
          coverW = Math.round((height * 16) / 9);
        }
        if (player.setSize) {
          player.setSize(coverW, coverH);
        }
        var frame = player.getIframe();
        if (!frame) {
          return;
        }
        frame.style.position = 'absolute';
        frame.style.left = Math.round((width - coverW) / 2) + 'px';
        frame.style.top = Math.round((height - coverH) / 2) + 'px';
        frame.style.pointerEvents = 'none';
        frame.setAttribute('tabindex', '-1');
        window.scrollTo(0, 0);
      }
      window.fitStage = fit;
      function playCurrent() {
        if (!player || failures >= ids.length) {
          post('failed');
          return;
        }
        player.loadVideoById(ids[index]);
        applyAudio();
        arm();
      }
      function advance() {
        clearWatch();
        if (failures >= ids.length) {
          post('failed');
          return;
        }
        var ended = ids[index];
        index += 1;
        if (index >= ids.length) {
          shuffle(ids);
          index = 0;
          if (ids.length > 1 && ids[0] === ended) {
            var swap = ids[0];
            ids[0] = ids[1];
            ids[1] = swap;
          }
        }
        playCurrent();
      }
      function onReady() {
        fit();
        applyAudio();
        player.playVideo();
        arm();
      }
      function onStateChange(event) {
        applyAudio();
        if (event.data === 1) {
          clearWatch();
          failures = 0;
          fit();
          post('playing');
        } else if (event.data === 0) {
          failures = 0;
          advance();
        }
      }
      function onError() {
        failures += 1;
        advance();
      }
      window.addEventListener('resize', fit);
      window.addEventListener('scroll', function () {
        window.scrollTo(0, 0);
      }, true);
      document.addEventListener('keydown', function (event) {
        var key = event.keyCode;
        if (key === 37 || key === 38 || key === 39 || key === 40) {
          event.preventDefault();
        }
      }, true);
      setTimeout(function () {
        if (!player) {
          post('failed');
        }
      }, 30000);
      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          videoId: ids[0],
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 0,
            disablekb: 1,
            iv_load_policy: 3,
            origin: ${JSON.stringify(STAGE_EMBED_ORIGIN)}
          },
          events: {
            onReady: onReady,
            onStateChange: onStateChange,
            onError: onError
          }
        });
      }
    </script>
    <script src="https://www.youtube.com/iframe_api"></script>
  </body>
</html>`;
}
