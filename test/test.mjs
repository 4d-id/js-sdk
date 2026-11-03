import { mint, mintPrivate, parse, zoneOf, Local, FOURDID } from "../src/index.js";
let fail=0; const t=(n,c)=>{ console.log(`  ${c?"ok  ":"FAIL"} ${n}`); if(!c) fail++; };
const id = mint(33.713,-117.943,{vref:"floor.12"});
t("spatial mint is valid", FOURDID.test(id));
const p = parse(id); t("parse vref", p.vref==="floor.12"); t("parse variant", p.variant==="h3");
t("spatial UUIDv4 mint includes genesis", /^\d{8}T\d{6}Z$/.test(p.genesis));
t("zoneOf shorter than cell", zoneOf(p.cell).length <= p.cell.length);
const privateId = mintPrivate("6c986e8b29c144bb9c5701c8e9cf1564");
const pp = parse(privateId);
t("private mint uses non-spatial id variant", pp.variant==="id" && pp.cell==="6c986e8b29c144bb9c5701c8e9cf1564" && pp.genesis===null);
let privateReject=false; try { mintPrivate("contains spaces"); } catch { privateReject=true; }
t("private home token is validated", privateReject);

const L = new Local();
const first = L.resolveOrCreate({lat:33.713,lng:-117.943,label:"unit",cls:"built:property",address:"2058 Valley Rd"});
t("first resolve-or-create mints", first.created && first.outcome==="minted");
const second = L.resolveOrCreate({lat:0,lng:0,label:"changed input",cls:"built:property",address:"2058 Valley Rd"});
t("second resolve-or-create reuses exact identity", !second.created && second.outcome==="reused" && second.entity.id===first.entity.id);
const r = L.resolve({registry:"address",external_id:"2058 Valley Rd"});
t("resolve returns reused id", r && r.id===first.entity.id);
t("context has class", L.context(first.entity.id).class==="built:property");
let duplicateReject=false; try { L.create({lat:33.7,lng:-117.9,address:"2058 Valley Rd"}); } catch { duplicateReject=true; }
t("explicit duplicate mint is rejected", duplicateReject);

const other = L.create({lat:33.8,lng:-117.8,apn:"APN-2"});
const ambiguous = L.resolveOrCreate({lat:33.7,lng:-117.9,address:"2058 Valley Rd",apn:"APN-2"});
t("conflicting exact aliases return ambiguity without mint", ambiguous.outcome==="ambiguous" && ambiguous.candidates.includes(other.id) && L.all().length===2);
console.log(`\n${fail?"FAIL":"PASS"}: ${fail} problem(s).`); process.exit(fail?1:0);
