// @4d-id/js — the 4D-ID JavaScript/TypeScript SDK.
// Two ways to use it:
//   1. Local: mint and resolve identities in-process (browser or Node), no server.
//   2. Client: talk to a running 4D-ID resolver over its REST binding.
// Both speak the same access operations defined in the 4D-ID specification, Clause 10.

import * as h3 from "h3-js";
import { randomUUID } from "node:crypto";

export const FOURDID =
  /^4did:[A-Za-z0-9]{1,8}:(?:[A-Za-z0-9_-]{22,86}\.)?[A-Za-z0-9.-]{1,64}(?:;v=[A-Za-z0-9.-]{1,40})?:[A-Za-z0-9_-]{22,86}(?::[0-9]{8}T[0-9]{6}(?:\.[0-9]{1,6})?Z)?$/;

const ANCHOR_RES = 12, ZONE_RES = 6;

function descriptor() {
  const u = (typeof randomUUID === "function" ? randomUUID() : crypto.randomUUID()).replace(/-/g, "");
  const bytes = u.match(/.{2}/g).map(h => parseInt(h, 16));
  const bin = String.fromCharCode(...bytes);
  const b64 = (typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64"));
  return b64.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

/** Parse a canonical 4D-ID into its parts (Part 1, 7.2). */
export function parse(id) {
  if (!FOURDID.test(id)) throw new Error(`invalid 4D-ID: ${id}`);
  const body = id.slice(5);
  const variant = body.slice(0, body.indexOf(":"));
  const rest = body.slice(body.indexOf(":") + 1);
  const fc = rest.indexOf(":");
  let cellPart = rest.slice(0, fc); const tail = rest.slice(fc + 1);
  let vref = null; const vi = cellPart.indexOf(";v=");
  if (vi !== -1) { vref = cellPart.slice(vi + 3); cellPart = cellPart.slice(0, vi); }
  let domain = null, cell = cellPart; const dot = cellPart.indexOf(".");
  if (variant === "oct" && dot !== -1) { domain = cellPart.slice(0, dot); cell = cellPart.slice(dot + 1); }
  const gm = tail.match(/^(.*?)(?::([0-9]{8}T[0-9]{6}(?:\.[0-9]{1,6})?Z))?$/);
  return { variant, domain, cell, vref, local: gm[1], genesis: gm[2] || null };
}

/** Mint a valid 4D-ID anchored at a latitude/longitude. */
export function mint(lat, lng, { vref = null } = {}) {
  const cell = h3.latLngToCell(lat, lng, ANCHOR_RES);
  return `4did:h3:${cell}${vref ? `;v=${vref}` : ""}:${descriptor()}`;
}

/** The DGGS zone that contains an anchor cell (the routing/home-register key). */
export function zoneOf(cell) {
  return h3.getResolution(cell) > ZONE_RES ? h3.cellToParent(cell, ZONE_RES) : cell;
}

/** A local, in-process 4D-ID store: mint, register, resolve, context. No server. */
export class Local {
  constructor() { this.entities = new Map(); this.ext = new Map(); }
  create({ lat, lng, label, cls, address, apn, vref = null, relations = [] }) {
    const id = mint(lat, lng, { vref });
    const cell = parse(id).cell;
    const rels = [
      ...(address ? [{ type: "identified_as", registry: "address", external_id: address }] : []),
      ...(apn ? [{ type: "identified_as", registry: "parcel.apn", external_id: apn }] : []),
      ...relations
    ];
    const ent = { id, anchor: { variant:"h3", cell, resolution: ANCHOR_RES }, zone: zoneOf(cell), lat, lng,
      labels: label ? [{ text: label }] : [], class: cls || null, relations: rels, minted: new Date().toISOString() };
    this.entities.set(id, ent);
    for (const r of rels) if (r.type === "identified_as") this.ext.set(`${r.registry}\u0000${r.external_id.toLowerCase()}`, id);
    return ent;
  }
  resolve({ registry, external_id, id }) {
    const t = id || (registry && external_id && this.ext.get(`${registry}\u0000${external_id.toLowerCase()}`));
    const e = t && this.entities.get(t);
    return e ? { id: e.id, locator: e.zone } : null;
  }
  entity(id) { return this.entities.get(id) || null; }
  context(id) {
    const e = this.entities.get(id); if (!e) return null;
    return { id: e.id, class: e.class, labels: e.labels, position:{lat:e.lat,lng:e.lng},
      zone: e.zone, relations: e.relations, minted: e.minted };
  }
  all() { return [...this.entities.values()]; }
}

/** A client for a running 4D-ID resolver (the REST binding of Clause 10). */
export class Client {
  constructor(baseUrl) { this.base = baseUrl.replace(/\/$/, ""); }
  async #get(path) { const r = await fetch(this.base + path); if (!r.ok) return null; return r.json(); }
  resolve({ registry, external_id, id }) {
    const q = id ? `id=${encodeURIComponent(id)}` : `registry=${encodeURIComponent(registry)}&external_id=${encodeURIComponent(external_id)}`;
    return this.#get(`/resolve?${q}`);
  }
  entity(id) { return this.#get(`/entity/${encodeURIComponent(id)}`); }
  state(id, at) { return this.#get(`/entity/${encodeURIComponent(id)}/state${at?`?at=${encodeURIComponent(at)}`:""}`); }
  relations(id, opts = {}) { const p = new URLSearchParams(opts).toString(); return this.#get(`/entity/${encodeURIComponent(id)}/relations${p?`?${p}`:""}`); }
  representations(id, purpose) { return this.#get(`/entity/${encodeURIComponent(id)}/representations?purpose=${encodeURIComponent(purpose)}`); }
  context(id, opts = {}) { const p = new URLSearchParams(opts).toString(); return this.#get(`/entity/${encodeURIComponent(id)}/context${p?`?${p}`:""}`); }
  snapshot() { return this.#get(`/snapshot`); }
  watch({ cells, id, since = 0 }) { const q = new URLSearchParams({ ...(cells?{cells}:{}) , ...(id?{id}:{}), since }).toString(); return this.#get(`/watch?${q}`); }
}
