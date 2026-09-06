# @4d-id/js

The 4D-ID™ JavaScript / TypeScript SDK. Create syntactically valid identifiers from caller-supplied grounding, then resolve and query records in the browser or against a resolver.

The SDK does not perceive, ground, localize, register, or render an entity. Like a UUID, a generated token provides uniqueness but does not establish which real-world thing it denotes; 4D-ID records add resolution, aliases, hierarchy, representations, state/time, provenance, and lifecycle continuity.

[![npm](https://img.shields.io/npm/v/@4d-id/js.svg)](https://www.npmjs.com/package/@4d-id/js)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

```bash
npm install @4d-id/js
```

## Two ways to use it

**Local** — create syntactically valid identifiers from caller-supplied grounding and resolve them in-process, with no server. Works in the browser or Node.

```js
import { Local, mint, parse } from "@4d-id/js";

// create a syntactically valid identifier from caller-supplied grounding
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
const reps = await api.representations(id, "agent-context"); // ranked records
const changes = await api.watch({ cells: ctx.zone, since: 0 });
```

Both speak the same access operations defined in the [4D-ID specification](https://github.com/4d-id/spec), Clause 10.

## API

- `mint(lat, lng, { vref })` — creates a syntactically valid identifier from caller-supplied grounding; it does not establish identity truth or perform matching.
- `parse(id)` — the identifier's parts (variant, cell, vref, domain, local, genesis).
- `zoneOf(cell)` — the DGGS zone (routing / home-register key).
- `Local` — an in-process store: `create`, `resolve`, `entity`, `context`, `all`.
- `Client(baseUrl)` — a resolver client: `resolve`, `entity`, `state`, `relations`, `representations`, `context`, `snapshot`, `watch`.

## License

Apache-2.0. Built on the royalty-free [4D-ID specification](https://github.com/4d-id/spec).
