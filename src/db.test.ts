import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { assert, assertEquals } from "@std/assert";
import { CardAttempt } from "./db.ts";

describe("db", () => {
  let db: Deno.Kv;

  const userId = "foo";

  beforeEach(async () => {
    const file = await Deno.makeTempFile();
    db = await Deno.openKv(file);
  });

  afterEach(() => {
    db.close();
  });

  describe("users", () => {
    it("should create a new user", async () => {
      const path = ["users", "1"];
      await db.set(path, { name: "John Doe" });
      const user = await db.get(path);
      assert(user);
    });

    it("should create a new thing", async () => {
      for await (const { key, value } of db.list({ prefix: [] })) {
        assert(false, "should not have any keys");
      }
    });
  });

  describe("Cards", () => {
  });

  describe("CardAttempt", () => {
    it("should create a new card attempt", async () => {
      assertEquals(await CardAttempt.readAll(db, userId), []);
      const result = await CardAttempt.create(db, userId, {
        cardId: "1",
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      assert(result);
      assertEquals((await CardAttempt.readAll(db, userId)).length, 1);
    });

    it("should read a card attempt", async () => {
      const cardAttempt = await CardAttempt.create(db, userId, {
        cardId: "1",
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      assert(cardAttempt);
      const result = await CardAttempt.read(db, userId, cardAttempt.id);
      assert(result);
      assertEquals(result.id, cardAttempt.id);
    });

    it("should read all card attempts and sort by date", async () => {
      const cardAttempt1 = await CardAttempt.create(db, userId, {
        cardId: "1",
        date: Temporal.PlainDateTime.from("2021-01-01T00:00:00").toString(),
        correct: true,
      });
      const cardAttempt2 = await CardAttempt.create(db, userId, {
        cardId: "1",
        date: Temporal.PlainDateTime.from("2021-01-02T00:00:00").toString(),
        correct: true,
      });
      assert(cardAttempt1);
      assert(cardAttempt2);

      const results = await CardAttempt.readAll(db, userId);
      assertEquals(results.length, 2);

      // Ensure the results are sorted by date with newest first
      assertEquals(results[0].id, cardAttempt2.id);
      assertEquals(results[1].id, cardAttempt1.id);
    });

    it("should delete a card attempt", async () => {
      const cardAttempt = await CardAttempt.create(db, userId, {
        cardId: "1",
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      assertEquals((await CardAttempt.readAll(db, userId)).length, 1);
      assert(cardAttempt);
      await CardAttempt.delete(db, userId, cardAttempt.id);
      assertEquals((await CardAttempt.readAll(db, userId)).length, 0);
    });
  });
});
