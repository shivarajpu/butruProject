# Multi-Client (White-Label) Build System

Ek React Native codebase → alag-alag branded Android + iOS apps, har ek apne
bundle ID / app ID ke saath apne store account pe publish hoti hai.

---

## Core concept

`clients/clients.json` hi **single source of truth** hai. Baaki sab kuch usse
generate hota hai. Koi bhi doosri jagah client ki info manually likhi nahi jaati.

```
                    clients/clients.json          (committed, non-secret)
                              │
                              │  npm run clients:sync
                              ▼
        ┌─────────────────────────────────────────────────────┐
        │  .env.<client>.<env>        per-client API + secrets  │  git-ignored
        │  src/config/clients/active.ts   brand/theme/tenant     │  git-ignored
        │  clients/active.json          native build record      │  git-ignored
        │  android/app/build.gradle      productFlavors           │  Phase 3
        │  android/app/src/<flavor>/     strings/colors/icons    │  Phase 3
        │  ios/Config/Clients/*.xcconfig  bundle id/name/icon    │  Phase 4
        └─────────────────────────────────────────────────────┘
```

Do deliberate decisions jo isko scalable banate hain:

1. **Sirf active client ka config bundle hota hai.** `active.ts` mein sirf wahi
   client hota hai jo build ho raha hai — baaki nahi. Isse (a) bundle size
   clients ke saath nahi badhta, (b) Client A ka APK decompile karke Client B ka
   store slug nahi milta.
2. **Native build systems ko koi flag nahi jaata.** Gradle aur Xcode dono
   `clients/active.json` padhte hain. Isliye CI/EAS par bhi JS, Android aur iOS
   kabhi disagree nahi kar sakte ki kaunsa client build ho raha hai.

---

## Quick start

```bash
# Saare clients dekho
npm run clients:list

# Default client (butru) ke liye sab kuch regenerate karo
npm run clients:sync

# Kisi specific client ke liye
npm run clients:sync -- --client clienta
npm run clients:sync -- --client clienta

# Sabhi client x environment combinations validate karo (CI ke liye)
npm run clients:sync:all
```

Phir build / run:

```bash
npm start -- --client clienta                     # Metro
npm run android -- --client clienta               # device pe install (debug)
npm run android:dev -- --client clienta
npm run ios -- --client clienta
```

Client `-- --client <id>` se choose hota hai. Store build ke liye
`--release` ya `npm run android:release` / `npm run ios:release`.

Jab `npm run android:*` ya `npm run ios:*` chalta hai, sync **automatically**
pehle chal jaata hai — manually call karne ki zaroorat nahi.

---

## Environment vs client

Ek client = ek row. Bas **client** ek axis hai; environment koi nahi hai.

| Axis | Kya control karta hai |
|---|---|
| **Client** | bundle ID, app ID, app name, icon, colours, tenant, API base URL |

Har client ka apna **ek** `api.baseUrl` hota hai — jaisa app pehle tha.
`debug` aur `release` sirf **build type** hain (minification/signing), environment
nahi: Client A ka release build bhi Client A hi production API pe jata hai.

Cleartext HTTP bhi alag flag nahi hai — `api.baseUrl` ke scheme se derive hota
hai. `https://` wala client hamesha cleartext block karta hai, isliye galat
direction me bhoolna possible hi nahi.

Total build targets: **2 clients × 2 build types = 4** (`butruDebug`,
`clientaDebug`, `butruRelease`, `clientaRelease`).

---

## Secrets

Kabhi bhi real key `clients/clients.json` mein nahi daalni.

```bash
cp clients/secrets.example.json clients/secrets.json   # git-ignored
```

`clients/secrets.json` `clients/clients.json` ke **upar** deep-merge hota hai —
sirf wahi likho jo secret hai. Teen layers, priority high→low:

1. `clients/clients.json` — committed defaults
2. `clients/secrets.json` — git-ignored secrets
3. `process.env` — CI / EAS secret overrides (sirf un keys ke liye jo client
   already declare karta hai)

`.env*`, `clients/active.json`, `src/config/clients/active.ts` aur
`ios/Config/Client.xcconfig` sab git-ignored hain aur har build pe regenerate
hote hain.

---

## Naya client kaise add karein (Phase 13 mein poora detail)

1. `clients/clients.json` mein ek naya block add karo.
2. `npm run clients:sync -- --client <id>`
3. `npm run android -- --client <id>` se verify karo.

Koi `build.gradle` edit nahi, koi Xcode project edit nahi, koi source file
duplicate nahi.

---

## Files

| Path | Role |
|---|---|
| `clients/clients.json` | Source of truth — **edit this** |
| `clients/secrets.example.json` | Secrets template → copy to `secrets.json` |
| `clients/active.json` | Generated native build record (git-ignored) |
| `scripts/lib/clientRegistry.js` | Shared loader + validation |
| `scripts/sync-clients.js` | Main codegen entrypoint |
| `scripts/sync-clients-all.js` | Validate every client × env |
| `scripts/gen-env.js` | Writes the `.env` files |
| `scripts/run.js` | Sync + build orchestrator for all npm scripts |
| `scripts/generators/` | Per-platform generators (android, ios) |
| `src/config/app_config.ts` | Base config / fallback layer — **edit for global defaults** |
| `src/config/clients/index.ts` | Resolver: base + active client overrides |

---

## Notes

- `src/config/app_config.ts` **base layer** hai. Usme kuch bhi chhod sakte ho —
  jo cheez har client ke liye same hai wahan rakho, jo alag hai `clients.json`
  mein. Per-client config uske upar merge hoti hai.
- `npm test` hamesha default client ke against chalta hai (`pretest` sync karta
  hai), isliye tests non-deterministic nahi hote.
- `npx jest` seedha chalane par aakhri sync kiya hua client test hoga — `npm test`
  use karo.
