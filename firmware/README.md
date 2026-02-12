# micro:bit data collection firmware

C++ firmware for micro:bit V1 and V2 that exposes Bluetooth accelerometer and
button services for use by the app.

Note: We tried switching to MakeCode for this firmware. It's viable on V2 but
not V1 as you hit sporadic 020 memory errors. There are also difficulties in
the MakeCode settings UI switching Bluetooth security modes (the change doesn't
always seem to take effect in the downloaded hex).

## Structure

```
firmware/
  source/
    main.cpp              Shared application source (identical for V1 and V2)
  v1/
    config-no-pairing.json    BLE config: open link (web app)
    config-just-works.json    BLE config: no-MITM bonding (native app)
    module.json               Yotta module definition
    ...                       Yotta build scaffolding
  v2/
    codal-no-pairing.json     BLE config: open link (web app)
    codal-just-works.json     BLE config: no-MITM bonding (native app)
    build.py                  CODAL build script
    CMakeLists.txt            CMake build definition
    ...                       CODAL build scaffolding (from microbit-v2-samples)
  build.sh                  Builds all hex files
  create-universal-hex.mjs  Combines V1 + V2 hex into a universal hex
```

## Building

Prerequisites: Docker.

```bash
./firmware/build.sh
```

This builds both BLE security variants for both micro:bit versions and writes
six hex files to `src/device/firmware/`:

| File                                                | Description                                |
| --------------------------------------------------- | ------------------------------------------ |
| `microbit-data-collection-no-pairing-v1.hex`        | V1, open link (web app)                    |
| `microbit-data-collection-no-pairing-v2.hex`        | V2, open link (web app)                    |
| `microbit-data-collection-no-pairing-universal.hex` | Universal, open link (web app)             |
| `microbit-data-collection-just-works-v1.hex`        | V1, just-works bonding (native app)        |
| `microbit-data-collection-just-works-v2.hex`        | V2, just-works bonding (native app)        |
| `microbit-data-collection-just-works-universal.hex` | Universal, just-works bonding (native app) |

## BLE security variants

Both variants enable Bluetooth pairing mode (triple-tap to enter pairing) and
expose the same services. They differ only in BLE security level:

- **no-pairing** (`SECURITY_MODE_ENCRYPTION_OPEN_LINK`): No bonding or
  encryption required. Used by the web app which connects via Web Bluetooth.
- **just-works** (`SECURITY_MODE_ENCRYPTION_NO_MITM`): Bonding and encryption
  without a passkey. Used by the native app.

## Build systems

V1 and V2 use different SDKs and build toolchains but share the same `main.cpp`:

- **V1** uses the micro:bit DAL built with yotta. Config is in `config.json`
  (generated from `config-{variant}.json` at build time).
- **V2** uses CODAL built with CMake via `build.py`. Config is in `codal.json`
  (generated from `codal-{variant}.json` at build time). The V2 scaffolding
  originates from
  [microbit-v2-samples](https://github.com/lancaster-university/microbit-v2-samples).

Both build inside the same Docker image
(`ghcr.io/carlosperate/microbit-toolchain`).
