import { Db, getKv } from "./db.ts";

/// Paths

if (import.meta.main) {
  const kv = await getKv();
  const userResult = await Db.User.create(kv, { name: "Audrow" });
  if (userResult.isErr()) throw new Error(userResult.unwrapErr());
}
