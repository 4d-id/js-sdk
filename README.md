# @4d-id/js

The 4D-ID™ JavaScript SDK for caller-grounded records, exact-identifier reuse, privacy-mode identifiers, and resolver queries.

The SDK does not perceive, ground, localize, register, or render an entity. Like a UUID, a generated token provides uniqueness but does not establish which real-world thing it denotes; 4D-ID records add resolution, aliases, hierarchy, representations, state/time, provenance, and lifecycle continuity.

[![npm](https://img.shields.io/npm/v/@4d-id/js.svg)](https://www.npmjs.com/package/@4d-id/js)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

```bash
npm install @4d-id/js
```

## Two ways to use it

**Local** — create syntactically valid identifiers from caller-supplied grounding and resolve them in-process, with no server. Works in the browser or Node.

```js
import { Local, mint, mintPrivate, parse } from "@4d-id/js";

// Spatial form: the cell is immutable genesis/routing metadata, not current location.
const id = mint(33.713, -117.943, { vref: "floor.12" });

// Privacy mode: the home token carries no place, person, or time information.
const privateId = mintPrivate("6c986e8b29c144bb9c5701c8e9cf1564");

const world = new Local();
const result = world.resolveOrCreate({
  lat: 33.713, lng: -117.943, label: "Unit 1204",
  cls: "built:property", address: "2058 Valley Rd"
});
// Run the same operation again and result.outcome is "reused", not "minted".

world.resolve({ registry: "address", external_id: "2058 Valley Rd" });
world.context(result.entity.id);
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

- `mint(lat, lng, { vref })` creates a spatial-form identifier from caller-supplied grounding. Its cell is genesis/routing metadata, not current location or identity evidence.
- `mintPrivate(homeToken)` creates a non-spatial `id`-variant identifier without place or time metadata.
- `parse(id)` returns the identifier parts.
- `zoneOf(cell)` returns a DGGS routing zone for spatial-form records.
- `Local.resolveOrCreate(...)` resolves exact aliases first, reports ambiguity, and mints only when none resolve.
- `Local.create(...)` is an explicit mint and rejects an already-bound exact alias.
- `Client(baseUrl)` — a resolver client: `resolve`, `entity`, `state`, `relations`, `representations`, `context`, `snapshot`, `watch`.

## License

Apache-2.0. Built against the 4D-ID 2.4 working draft offered for community review.
