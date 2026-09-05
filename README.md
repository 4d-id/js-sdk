# @4d-id/js

The 4D-ID™ JavaScript / TypeScript SDK. Mint, resolve, and query spatial identities, in the browser or against a resolver.

[![npm](https://img.shields.io/npm/v/@4d-id/js.svg)](https://www.npmjs.com/package/@4d-id/js)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

```bash
npm install @4d-id/js
```

## Two ways to use it

**Local** — mint and resolve in-process, no server. Works in the browser or Node.

```js
import { Local, mint, parse } from "@4d-id/js";

// mint a valid 4D-ID for a place
const id = mint(33.713, -117.943, { vref: "floor.12" });
// -> "4did:h3:8c29a0b...;v=floor.12:AZmR3kB8..."

const world = new Local();
const unit = world.create({ lat: 33.713, lng: -117.943, label: "Unit 1204", cls: "built:property", address: "2058 Valley Rd" });

world.resolve({ registry: "address", external_id: "2058 Valley Rd" }); // -> { id, locator }
world.context(unit.id); // -> compact description
```

**Client** — talk to a running [4D-ID resolver](https://github.com/4d-id/reference-resolver) over its REST binding.

```js
import { Client } from "@4d-id/js";

const api = new Client("https://resolver.example.org");
const { id } = await api.resolve({ registry: "asset.register", external_id: "TB-WH-01" });
const ctx  = await api.context(id);                          // agent-ready envelope
const reps = await api.representations(id, "rendering");     // ranked assets
const changes = await api.watch({ cells: ctx.zone, since: 0 });
```

Both speak the same access operations defined in the [4D-ID specification](https://github.com/4d-id/spec), Clause 10.

## API

- `mint(lat, lng, { vref })` — a valid, self-minted 4D-ID.
- `parse(id)` — the identifier's parts (variant, cell, vref, domain, local, genesis).
- `zoneOf(cell)` — the DGGS zone (routing / home-register key).
- `Local` — an in-process store: `create`, `resolve`, `entity`, `context`, `all`.
- `Client(baseUrl)` — a resolver client: `resolve`, `entity`, `state`, `relations`, `representations`, `context`, `snapshot`, `watch`.

## License

Apache-2.0. Built on the royalty-free [4D-ID specification](https://github.com/4d-id/spec).
