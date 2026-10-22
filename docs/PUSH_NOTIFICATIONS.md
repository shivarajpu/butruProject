# Push notifications

How push notifications work in this app, what has to be true for them to reach a
device, and what to do when they do not.

Push is **off by default**. Every client in `clients/clients.json` ships with
`firebase.enabled: false`, and the app is built so that a build with no Firebase
configuration still runs — the bell stays empty and no crash happens. Enabling
push for a client is a deliberate, per-client step.

---

## 1. What is in place

| Piece | Where | What it does |
| --- | --- | --- |
| FCM + Notifee service | `src/services/push.ts` | Channels, permission, token lifecycle, foreground/background handling, tap routing |
| Background handler | `index.js` | `setBackgroundMessageHandler` so a backgrounded app is woken up |
| App wiring | `App.tsx` | Hydrates the feed, initialises push, re-registers the token on sign-in, resolves the initial notification |
| Notification API | `src/api/notifications.ts` | Feed, unread count, mark-read, device-token registration |
| Redux slice | `src/store/slices/notificationSlice.ts` | Feed state, unread count, filters, persistence |
| Notification screen | `src/screens/NotificationScreen.tsx` | The in-app feed |
| Bell badge | `src/home/HomeTab.tsx` | Unread count on the bell icon |
| Per-client config | `scripts/generators/firebase.js` | Copies each client's Firebase files into the build |
| API contract | `docs/api/notifications.openapi.yaml` | The endpoints the backend has to provide |

Notifee owns notification display **and** the tap event. RNFirebase's
`onNotificationOpenedApp` / `getInitialNotification` are deliberately not used —
using both means the same tap can fire two navigations.

---

## 2. Enabling push for a client

### Step 1 — create the Firebase project

One Firebase project **per client**. A single project cannot serve two apps with
different bundle IDs / application IDs, and sharing one means one client's
notifications leak into another's app.

### Step 2 — download the config files

| Platform | File | Put it at |
| --- | --- | --- |
| Android | `google-services.json` | `clients/firebase/<client>/android/google-services.json` |
| iOS | `GoogleService-Info.plist` | `clients/firebase/<client>/ios/GoogleService-Info.plist` |

Both paths are git-ignored on purpose — they contain API keys. Anyone who needs
them takes them from the Firebase console or a secrets manager, not from git.

The Android file may also be dropped straight into
`android/app/src/<flavor>/google-services.json` — the sync picks it up from
there and leaves it alone.

#### Android: one package name per client

A client has **one** application ID, and its debug build and its release
build share it — the build no longer appends a `.debug` suffix. Android and
iOS use the same ID for a client too.

| Client | Package name / bundle ID to register in Firebase |
| --- | --- |
| `butru` | `com.butruproject` |
| `clienta` | `com.company.clienta` |

Register that one name in the Firebase project (Android app **and** iOS app),
then download the config — the downloaded `google-services.json` then carries
an entry for it and every build type works.

Why one name and not one per build type: the Google Services plugin matches
the config by package name, so a `.debug` suffix would mean two Firebase app
registrations, two config files and a build that fails with
`No matching client found for package name '…'` whenever the two drift apart.
The price is that a debug build replaces the store build on the device — install
the release build again when you need the store app.

Changing a client's ID means changing it in `clients/clients.json` and running
`npm run clients:sync -- --client <id>`; the Gradle `applicationId`, the
per-flavour block, the Xcode `PRODUCT_BUNDLE_IDENTIFIER` and
`clients/active.json` all follow from that one place.

### Step 3 — turn the client on

`clients/clients.json`:

```json
"firebase": {
  "enabled": true,
  "androidFile": "clients/firebase/butru/android/google-services.json",
  "iosFile": "clients/firebase/butru/ios/GoogleService-Info.plist"
}
```

`enabled: true` means "a config file will be there" — the sync fails loudly
when it is missing, because that is a mistake in the repository rather than a
state to work around. With `enabled: false` (or missing) the sync turns push
on anyway as soon as a config file is found on disk, so dropping the file in is
enough.

**The sync never deletes a config file.** An earlier version removed
`google-services.json` from the flavor directory whenever `firebase.enabled` was
false, which silently threw away a file that had to be downloaded from the
Firebase console again. The isolation it was meant to provide now comes from
the build instead: the Google Services plugin is applied only for a client
whose Firebase is on, so a leftover file is ignored rather than compiled in.

### Step 4 — sync and build

```bash
npm run clients:sync -- --client butru
npm run android -- --client butru     # or: npm run ios -- --client butru
```

`clients:sync` does the following:

- copies the client's `google-services.json` to `android/app/src/<flavor>/`,
- copies the client's `GoogleService-Info.plist` to
  `ios/butruProject/GoogleService-Info.plist` (and adds it to the Xcode
  project's Resources if it is not there yet),
- writes the placeholder plist when a client has no iOS config, so the build
  input always resolves,
- writes `clients/active.json`, which is what the Gradle build reads to decide
  whether to apply the Google Services plugin.

The Xcode scheme has a pre-action that runs `clients:sync`, so an Xcode build
refreshes the plist automatically. The generated plist is git-ignored.

---

## 3. Android

- The Google Services plugin (`com.google.gms:google-services:4.4.2`) is applied
  **only** when the active client has Firebase enabled and its
  `google-services.json` is in the flavor directory. Applying it
  unconditionally makes the build fail with
  `File google-services.json is missing`, which would break every build that
  does not use push.
- `POST_NOTIFICATIONS` is declared in the app manifest. Android 13+ therefore
  shows the runtime permission prompt; Notifee raises it.
- **Who draws the notification depends on the app state.** While the app is in
  the background, the Firebase SDK draws a message that carries a `notification`
  block by itself — the app's background handler deliberately does nothing
  then, so there is no second copy in the tray. While the app is **in the
  foreground**, the SDK draws nothing: `onMessage` fires and the app draws it
  through Notifee. A data-only message (what the server sends) is always
  drawn by the app, on both platforms.
- **Register the signing SHA-1 with the package name.** Firebase ties a package
  name to a set of SHA-1 fingerprints; a package name with no fingerprint
  registered cannot get a token. Get the fingerprints with
  `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
  and add the debug **and** the release keystore fingerprints to the Android
  app in the Firebase console. The package name and the fingerprint are
  registered together, so a new package name needs the same fingerprints
  added again.
- The notification icon is `android/app/src/main/res/drawable/ic_stat_notification.xml`
  (a white bell on transparent — the system recolours it).
- Three channels are created at runtime by `ensureNotificationChannels()`:

  | Channel id | Used for |
  | --- | --- |
  | `butru-default` | everything else; also the id in `firebase.json` so the library's own placeholder uses it |
  | `butru-promotions` | offers, coupons, campaigns |
  | `butru-orders` | order and delivery updates |

  The channel is chosen from the message's `type`: `coupon` / `offer` →
  promotions, `order` / `shipping` → orders, anything else → default.

  **A channel the user has muted stays muted.** Android keeps that choice
  across app updates, so a user who once silenced "promotions" will not see
  those notifications again. Channel ids must never change once shipped.

---

## 4. iOS

- **Firebase is distributed as Swift Package Manager only** from RNFB v27 on
  (Firebase 13+ is no longer published to CocoaPods). `ios/Podfile` therefore
  sets `use_frameworks! :linkage => :dynamic`. Without it `pod install` fails
  with `[!] [react-native-firebase] SPM + static linkage is not supported.`,
  and the only other way out — `$RNFirebaseDisableSPM = true` — is rejected by
  `@react-native-firebase/app/firebase_spm.rb`.
- `pod install` is required after adding or changing `firebase.json` — the
  podspec reads it at install time and passes the settings to the SDK. The
  build also injects it into the app's `Info.plist` as `firebase_json_raw`
  (base64), which is what `RNFBJSON` reads at runtime.
- `UIBackgroundModes` contains `remote-notification` in the base `Info.plist`
  and in each client's `Info.plist`, so a data-only message wakes the app.
- `ios/butruProject/butruProject.entitlements` declares
  `aps-environment` as `$(APS_ENVIRONMENT)`. `ios/Config/Debug.xcconfig` sets
  `APS_ENVIRONMENT = development` and `ios/Config/Release.xcconfig` sets
  `production`. The value has to match the provisioning profile.
- **The provisioning profile must include the Push Notifications capability.**
  An entitlement in the project cannot add the capability to a profile that
  does not have it; the build will fail to sign, or the token registration
  will fail at runtime with a `no valid aps-environment entitlement` error.
- **The bundle ID must exist in the Apple Developer account and in Firebase.**
  A client uses one bundle ID on iOS and Android (`com.butruproject` for
  `butru`), and `PRODUCT_BUNDLE_IDENTIFIER` comes from the generated
  `ios/Config/Clients/<id>.xcconfig`. After changing a bundle ID you need a
  new App ID, a provisioning profile that carries it, and a matching iOS app
  in the Firebase project — otherwise signing fails or the iOS token is never
  issued.
- Foreground presentation is handled by **Notifee**, not by FCM: the app
  displays the notification itself through
  `notifee.displayNotification()`, so
  `notification.ios.foregroundPresentationOptions` decides what the user sees
  while the app is open — `alert`, `banner` and `list` are on, `sound` is off
  (the user is looking at the app already). `firebase.json`'s
  `messaging_ios_foreground_presentation_options` only applies to messages that
  carry an FCM `notification` block, which the server does not send; it is set
  to `alert: true, badge: true, sound: false` so a console test message is
  still visible.

### Building for iOS

```bash
cd ios && pod install
xcodebuild -workspace ios/butruProject.xcworkspace -scheme butru \
  -configuration Debug -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath /tmp/butru-dd-device CODE_SIGNING_ALLOWED=NO build
```

This build was verified to succeed (`** BUILD SUCCEEDED **`) with
`RNFBApp.framework`, `RNFBMessaging.framework` and `RNNotifee.framework`
embedded in the app bundle.

> **Pitfall — stale prebuilt React Native Core.** React Native 0.87 links
> against a prebuilt `React.framework`. RN ships a Debug and a Release build of
> it and swaps the right one in through the `[RNCore] Replace React Native
> Core for the right configuration, if needed` build phase. If the Pods
> directory holds the **Release** framework while building Debug, the app link
> fails with
> `Undefined symbols ... facebook::react::Sealable::Sealable()` /
> `facebook::react::Props` from `ReactCodegen`. The fix is to let the Pods
> directory hold the Debug variant again:
>
> ```bash
> rm -rf ios/Pods/React-Core-prebuilt && (cd ios && pod install)
> ```
>
> `pod install` alone does not repair it — CocoaPods serves the cached pod
> source and leaves the directory untouched.

---

## 5. What the server sends

Push is a **data-only** message. The app builds and displays the notification
itself, which is what allows one payload to serve both platforms with the right
channel, title and deep link.

```json
{
  "data": {
    "title": "Your order is on the way",
    "body": "Order #4812 shipped",
    "type": "order",
    "link": "/orders",
    "notificationId": "ord_4812_shipped"
  }
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Falls back to the `notification` block, then to "Notification" |
| `body` | yes | Same fallback chain |
| `type` | no | `order` / `shipping` → Orders channel, `offer` / `coupon` → Promotions channel, anything else → default |
| `link` | no | Deep link, see below |
| `notificationId` | recommended | Stable id; the app dedupes on it, so a resend does not double-count the badge |

### iOS specifics

The APNs payload needs `content-available: 1` and `apns-priority: 5`:

```json
{
  "aps": { "content-available": 1 },
  "data": { "...": "..." }
}
```

Without `content-available`, iOS delivers the message lazily and a
data-only message is often dropped entirely for a backgrounded app.

### Android specifics

```json
{
  "data": { "...": "..." },
  "android": { "priority": "high" }
}
```

`high` matters for time-sensitive messages (delivery updates); without it
Android may defer the message under Doze.

### Deep links

`link` is resolved by `resolveLink` in `src/storefront/links.ts`:

| Link | Destination |
| --- | --- |
| `/cart`, `/bag` | Cart |
| `/wishlist` | Wishlist |
| `/orders`, `/my-orders` | My Orders |
| `/account`, `/profile` | Account |
| `/notification` | Notification centre |
| `/terms`, `/privacy`, `/shipping`, `/returns`, `/about` | The matching policy screen |
| `https://…` | Opened outside the app with `Linking.openURL` |
| Anything else | The catalogue, filtered by that slug (e.g. `/new-arrivals`) |

If the navigator is not ready yet when the notification is tapped, the
navigation is held and replayed by `flushPendingNavigation()` from
`App.tsx`'s `onReady`.

---

## 6. The API the backend has to provide

Defined in `docs/api/notifications.openapi.yaml`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/notifications?page=1&limit=20&type=all` | The feed |
| `GET` | `/api/notifications/unread-count` | The badge count |
| `POST` | `/api/notifications/{id}/read` | Mark one read |
| `POST` | `/api/notifications/read-all` | Mark everything read |
| `POST` | `/api/notifications/device-token/register` | Register an FCM token |
| `POST` | `/api/notifications/device-token/unregister` | Remove a token |

**These endpoints do not exist on the backend yet** — they currently return
`404`. The app treats a `404` as "there is nothing to show": the feed comes
back empty and the badge reads `0`, instead of the screen erroring out. Any
other failure (network down, `500`, timeout) still surfaces as an error.

The device-token register call sends:

```json
{
  "token": "<fcm-token>",
  "platform": "ios" | "android",
  "osVersion": "17.4",
  "appVersion": "1.0.0"
}
```

Token registration is idempotent and is re-sent on every app start and on every
sign-in, so a token that the server lost is recovered without user action.

---

## 7. Testing

```bash
npx jest __tests__/pushNotifications.test.ts   # FCM/Notifee behaviour
npx jest __tests__/notificationFeed.test.ts    # API normalisers + Redux slice
```

Both suites run against mocked native modules (`jest.setup.js`), so they need no
device and no Firebase project.

To test on a real device:

1. Enable push for the client and run `clients:sync`.
2. Build and install on a device.
3. Allow the permission prompt when it appears.
4. Read the FCM token from the log — a dev build prints it on startup:
   ```
   [push] FCM token: dXXXXX…
   ```
   It is also kept on `globalThis.__FCM_TOKEN__` so it can be read from the
   debugger without scrolling the log.
5. In the Firebase console → **Messaging → Create campaign**, pick the app's
   Firebase project, and send a **custom** message with the payload above
   (the default campaign builder cannot send data-only messages).
6. Check the device.

The Firebase console's **Test** tab (Messaging → New campaign → Test) lists the
devices that registered with the project and their tokens, so a single device
can be targeted without copying the token by hand. Note that a **release**
build does not print the token — the console log is dev-only.

For a plain notification without any custom code, the Firebase console's
notification composer works — the app falls back to the `notification` block.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| **Nothing arrives on the Android emulator, no error anywhere** | The emulator's DNS is broken, so FCM's host `mtalk.google.com` never resolves | See "Pitfall — the emulator's DNS" below |
| Nothing arrives on Android | The channel is muted | Check the system notification settings; a muted channel stays muted |
| Nothing arrives while the app is **in the foreground** | The app draws the notification itself (the SDK only draws it in the background) | Check the log for `could not display the notification` — the reason is printed there |
| `notifee.displayNotification(*) 'notification.id' invalid notification ID` | The notification was built without an id | Every notification must get a unique string id (see `notificationId()` in `src/services/push.ts`) |
| Nothing arrives on iOS, app foregrounded | The banner is a Notifee presentation option | `notification.ios.foregroundPresentationOptions` in `src/services/push.ts` controls it |
| Nothing arrives on iOS, app backgrounded | `content-available: 1` missing | Fix the APNs payload |
| `pod install` fails with `SPM + static linkage is not supported` | Firebase 13+ is SPM-only | Keep `use_frameworks! :linkage => :dynamic` in `ios/Podfile` |
| `Undefined symbols ... facebook::react::Sealable::Sealable()` when linking | The Pods dir holds the Release prebuilt `React.framework` while building Debug | `rm -rf ios/Pods/React-Core-prebuilt && (cd ios && pod install)` — see section 4 |
| "No Firebase App '[DEFAULT]' has been created" | Firebase is not enabled for the active client, or the sync did not run | `npm run clients:sync -- --client <id>` and check `clients/active.json` |
| `File google-services.json is missing` | The plugin was applied but the file is not in the flavor directory | Run `clients:sync`; check `android/app/src/<flavor>/` |
| `No matching client found for package name 'com.butruproject'` | The downloaded config has no entry for the client's current package name | Register `com.butruproject` in the Firebase project and download the config again (section 2) |
| `no valid aps-environment entitlement` | The provisioning profile has no push capability | Re-enable Push Notifications for the App ID and regenerate the profile |
| Token registered but the server never sends | The token was sent to the wrong Firebase project, or the client is disabled server-side | Confirm the project id in the `google-services.json` / `GoogleService-Info.plist` matches the project you send from |
| Badge count drifts | A push was delivered twice | Deduplication is by `notificationId`; send a stable id |
| The whole app crashes on launch | Usually a missing `GoogleService-Info.plist` on iOS | Run `clients:sync`; the Xcode pre-action does this for you |

### Pitfall — the emulator's DNS

A token prints, the app is installed, the permission is granted, the channels
exist — and still nothing arrives. That is what a **broken DNS in the
emulator** looks like, and it is invisible in the app: the SDK never gets far
enough to complain.

Check it in two commands:

```bash
adb shell 'ping -c 1 mtalk.google.com'   # must resolve
adb logcat -d | grep DnsResolver         # ETIMEDOUT on every query = broken
```

`ping: unknown host mtalk.google.com` means the emulator cannot resolve
anything. The cause is almost always the emulator's network daemon holding on
to a DNS server that no longer exists — it captures the host's DNS when it
starts and keeps using it:

```bash
ps aux | grep netsimd     # --host-dns=<server>
```

That happens when the host's DNS changes after the emulator started (a VPN
connecting or disconnecting is the usual reason). The server in `--host-dns`
then times out for every query.

The fix is to start the emulator with a DNS server that answers:

```bash
~/Library/Android/sdk/emulator/emulator -avd <avd> -dns-server 8.8.8.8,1.1.1.1
```

`-dns-server` is applied at start-up, so the emulator has to be restarted. A
private DNS override inside the guest (`settings put global private_dns_mode
hostname`) does not help: it still needs a working resolver underneath.

Note that a **release** build on a physical device has no such problem — this
is specific to the emulator's slirp/netsimd DNS forwarding.


---

## 9. Known gaps

- The backend endpoints in section 6 are not implemented yet.
- APNs authentication keys and the Firebase server credentials for sending are
  not in this repository — the sending side lives with the backend.
- `clients/firebase/**` is empty on purpose; the Firebase project files have to
  be supplied per client.
- No device has received a push yet: the Android APK and the iOS app both
  build, but there is no Firebase project in this repository to send from.
