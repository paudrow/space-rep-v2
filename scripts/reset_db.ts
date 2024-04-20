import { Db, getKv } from "../src/db.ts";

const kv = await getKv();

await Db.reset(kv);

console.log("Database reset");
