# power-bar

Spicetify extension that adds a quick-search bar to the Spotify desktop client.

- `src/app.tsx` — entry point; waits for Spicetify globals, mounts `PowerBar` into `document.body`.
- `src/components/PowerBar.tsx` — all behaviour: activation key combo, search input, suggestion navigation.
- `src/services/get-settings.ts` — settings schema, rendered into Spotify's preferences page via `spcr-settings`.

## Build & install

- `npm run build` — builds straight into the spicetify Extensions dir (`~/.config/spicetify/Extensions/power-bar.js`).
- `npm run build:local` — minified build into `dist/`.
- After building, run `spicetify apply` and restart Spotify to load the new code.

## Settings storage

Settings are **not** in this repo or in the spicetify config. `spcr-settings` writes them to the Spotify
client's Chromium localStorage under `<settingsId>.<nameId>`, e.g. `power-bar-settings.key-combo`.

On macOS that database lives at:

```
~/Library/Caches/com.spotify.client/Browser/Local Storage/leveldb
```

Values can be read without launching anything: `strings -a *.log *.ldb | grep -A3 power-bar-settings`.
Expect a JSON envelope: `{"value":["altKey","Space"]}`.

## Debugging the running Spotify client over CDP

`always_enable_devtools = 1` in `~/.config/spicetify/config-xpui.ini` makes Spotify expose a
Chrome DevTools Protocol endpoint on **127.0.0.1:9222**. This is the fastest way to inspect live
extension state — no need to guess from source or ask the user to read a console.

```bash
curl -s http://127.0.0.1:9222/json/list      # find the xpui page target + its webSocketDebuggerUrl
```

**Pick the target by URL, never by index.** Opening DevTools adds a *second* page target
(`devtools://...`) that can sort ahead of the app. A client that grabs `list[0]` will then evaluate
against the DevTools window instead of xpui and report every `window.*` probe as `undefined`, which
looks exactly like "the page reloaded". Match on `type == "page"` and `xpui.app.spotify.com` in the URL.

Also note that while the DevTools window has keyboard focus, keystrokes go to DevTools — the xpui page
receives nothing. Keep Spotify focused when reproducing a keyboard bug.

Connect a WebSocket to `webSocketDebuggerUrl` and use:

- `Runtime.evaluate` — read live state, e.g. `Spicetify.Platform.operatingSystem`,
  `Spicetify.LocalStorage.get('power-bar-settings.key-combo')`,
  `document.getElementById('power-bar-container').className` (`hidden` when closed).
- `Input.dispatchKeyEvent` — inject a **trusted** key event through Chromium's real input pipeline,
  so Spotify's own handlers run first. This is what distinguishes "our listener is broken" from
  "the keystroke never reached the app". Note that dispatching both `rawKeyDown` and `keyDown`
  produces **two** DOM `keydown` events, which will toggle the power bar twice.

A synthetic `new KeyboardEvent(...)` dispatched from `Runtime.evaluate` only tests our own handler —
it bypasses the OS and Spotify's input layer, so it cannot prove end-to-end delivery. Use
`Input.dispatchKeyEvent` for that.

## Spotify client API drift

Spotify renames/removes `Spicetify.Platform` fields between releases, and `src/types/spicetify.d.ts`
is a vendored copy that can be out of date — it will happily type-check a field that no longer exists
at runtime. When something silently misbehaves, check the real object over CDP before trusting the
types.

Known drift: `Spicetify.Platform.PlatformData.os_name` was removed (Spotify 1.2.97). The OS is now
`Spicetify.Platform.operatingSystem` (`'macOS'` | `'Windows'` | `'Linux'`).
