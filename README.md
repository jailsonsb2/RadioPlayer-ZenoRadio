# HTML5 Icecast/Shoutcast/Zeno Radio Full Page Radio Player with PWA Support

A modern, dependency-free "now playing" radio player: the album art of the current song becomes a blurred full-page backdrop, with glass-style circular controls on top. No Bootstrap, no jQuery — just HTML, CSS and vanilla JavaScript.

* Current song with animated transitions and live metadata (Zeno Radio SSE or Azuracast polling)
* Cover art of the current song ([Deezer API](https://developers.deezer.com/login?redirect=/api))
* Lyrics of the current song via [lyrics.ovh](https://lyrics.ovh) with [LRCLIB](https://lrclib.net) fallback — no API key required, with request caching
* History of recently played songs (option to show or hide)
* Smooth volume fade in/out on play/pause (no audio "pop")
* Loading spinner while the stream buffers
* Automatic reconnection with backoff when the network drops
* Volume as a circular button with a slider popover (desktop; on mobile the hardware buttons rule)
* Media Session integration (lock screen / notification controls with artwork)
* Responsive design — mobile-first single column, side-by-side layout on desktop
* Progressive Web App (PWA) with an "Install app" button when the browser allows it
* Azuracast support

## Demo Screenshots

![Demo Screenshot](https://i.imgur.com/RYrH0BM.jpg)



# Documentation.

Open The [Script.js](https://github.com/jailsonsb2/RadioPlayer-ZenoRadio/blob/main/js/script.js) file and edit the lines Below.

```javascript
// RADIO NAME
const RADIO_NAME = 'Your Radio Name';

// Change Stream URL Zeno Radio Here.
const URL_STREAMING = 'https://stream.zeno.fm/yn65fsaurfhvv';

// You can find the mount point in the Broadcast Settings.
// To generate the Zeno Radio API link from the mount point,
// exclude the '/source' part and append the remaining mount point to the base URL of the API.
// For example, if the mount point is 'yn65fsaurfhvv/source',
// the API link will be 'https://api.zeno.fm/mounts/metadata/subscribe/yn65fsaurfhvv'.

const url = 'https://api.zeno.fm/mounts/metadata/subscribe/yn65fsaurfhvv';

// Variable to control history display: true = display / false = hides
let showHistory = true; 

 ```

## Azuracast

For Azuracast there is a ready-made page: [index_azura.html](index_azura.html) (deploy it as-is or rename it to `index.html`). Just edit the constants at the top of [js/script_azura.js](js/script_azura.js) — `RADIO_NAME`, `URL_STREAMING` and `API_URL` pointing to your `/api/nowplaying/<station>` endpoint.

Because the Azuracast API is richer, this version shows extras that the Zeno version can't:

* **Up next** — the next song in the queue (`playing_next`), shown as a pill under the player controls
* **Full history with artwork** — up to 4 recently played songs, with covers coming straight from the Azuracast API (no Deezer lookups needed)

 ## Change Logo.

 Open The img folder and add your logo named "cover.png"

 ## Zeno Radio API Now Playing.

To generate the Zeno Radio API link from the mount point,
exclude the '/source' part and append the remaining mount point to the base URL of the API.
You can find the mount point in the Broadcast Settings.
For example, if the mount point is 'yn65fsaurfhvv/source',
the API link will be 'https://api.zeno.fm/mounts/metadata/subscribe/yn65fsaurfhvv'.

![Demo Screenshot](https://i.imgur.com/8F61uyD.jpg)

## Customizing the Look

All the design tokens live at the top of [css/style.css](css/style.css) as CSS variables — change the accent color, surfaces and radius in one place:

```css
:root {
    --accent: #00e1e7;   /* accent color (slider, live dot glow, focus rings) */
    --bg: #0b0e13;       /* page background */
    --surface: rgba(255, 255, 255, 0.06);  /* glass surfaces */
    --border: rgba(255, 255, 255, 0.12);   /* glass borders */
    --radius: 20px;      /* card corner radius */
}
```

 ## Installation
Just put the files in your server or use Free Hosting



## Free Hosting

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jailsonsb2/RadioPlayer-ZenoRadio)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/jailsonsb2/RadioPlayer-ZenoRadio)

### Progressive Web App (PWA) Support

Now you can install the Radio Player as a Progressive Web App (PWA) to your device for an enhanced experience! When the browser signals that installation is available, an "Install app" button appears (top-right on desktop, bottom of the screen on mobile).

**Note:** after deploying an update, the service worker cache version in `service-worker.js` (`CACHE_NAME`) should be bumped so returning visitors get the new files.

### Configuring Radio Name and Colors

To configure the name of your radio and the colors used in the Progressive Web App (PWA), you need to edit the `manifest.json` file:

1. Open the `manifest.json` file in your project.
2. Locate the `"name"` field and replace `'Your Radio Name'` with the name of your radio.
3. If desired, you can also customize the `"background_color"` and `"theme_color"` fields to match your radio's branding colors.

Here's an example:

```json
{
  "name": "Your Radio Name",
  "short_name": "Radio Player",
  "start_url": "/index.html",
  "display": "standalone",
  "background_color": "#0b0e13",  // Customize this color to match your branding
  "theme_color": "#0b0e13",       // Customize this color to match your branding
  "icons": [
    {
      "src": "img/cover.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}

```

## Supported Hosting Types
* Zeno Radio
* Azuracast

## Supported API/Data Sources
* Deezer (cover art)
* lyrics.ovh + LRCLIB (lyrics)
* Azuracast

## Keyboard Controls 
* `M` - mute/unmute
* `P` and `space` - play/pause
* `arrow up` and `arrow down` - increase/decrease volume
* `0 to 9` - volume percent


## Feedback

If you have any feedback, please reach out to me at contact@jailson.es


## Credits
* [gsavio/player-shoutcast-html5](https://github.com/gsavio/player-shoutcast-html5)
* [joeyboli/RadioPlayer](https://github.com/joeyboli/RadioPlayer)


---

## ⚖️ License

This project is licensed under the **GNU AGPL-3.0** (see [LICENSE](LICENSE)): you are free to use, modify and redistribute it — including commercially — provided derivative works remain open source and keep the original copyright notices, **even when offered only as a hosted/network service**.

**Closed-source / commercial licensing:** to embed this code in a proprietary product without AGPL obligations, a separate commercial license is available — contact [contato@jailson.es](mailto:contato@jailson.es).

Copyright (C) 2024-2026 Jailson Bezerra ([@jailsonsb2](https://github.com/jailsonsb2))
