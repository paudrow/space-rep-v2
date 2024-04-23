import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { assert, assertEquals } from "@std/assert";
import { Card, CardAttempt, User } from "./db.ts";

describe("db", () => {
  let kv: Deno.Kv;

  const userId = "foo";

  beforeEach(async () => {
    const file = await Deno.makeTempFile();
    kv = await Deno.openKv(file);
  });

  afterEach(() => {
    kv.close();
  });

  describe("integration", () => {
    it("should delete a user and all related cards", async () => {
      const user1 = (await User.create(kv, { name: "John Doe" })).unwrap();
      const user2 = (await User.create(kv, { name: "Jane Doe" })).unwrap();

      assert(user1);
      assert(user2);

      const card1 = (await Card.create(kv, user1.id, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      })).unwrap();
      const card2 = (await Card.create(kv, user1.id, {
        question: "What is your phone number?",
        answer: "123-456-7890",
        type: "phone number",
      })).unwrap();
      const card3 = (await Card.create(kv, user2.id, {
        question: "What is your name?",
        answer: "Jane Doe",
        type: "text",
      })).unwrap();
      assert(card1);
      assert(card2);
      assert(card3);

      assertEquals((await User.readAll(kv)).length, 2);
      assertEquals((await Card.readAll(kv, user1.id)).length, 2);
      assertEquals((await Card.readAll(kv, user2.id)).length, 1);
      await User.delete(kv, user1.id);
      assertEquals((await User.readAll(kv)).length, 1);
      assertEquals((await Card.readAll(kv, user1.id)).length, 0);
      assertEquals((await Card.readAll(kv, user2.id)).length, 1);
    });

    it("should delete a card and related card attempts", async () => {
      const card1 = (await Card.create(kv, userId, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      })).unwrap();
      const card2 = (await Card.create(kv, userId, {
        question: "What is your phone number?",
        answer: "123-456-7890",
        type: "phone number",
      })).unwrap();
      assert(card1);
      assert(card2);

      await CardAttempt.create(kv, userId, {
        cardId: card1.id,
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      });
      await CardAttempt.create(kv, userId, {
        cardId: card2.id,
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      });
      assertEquals((await CardAttempt.readAll(kv, userId)).length, 2);

      assertEquals((await Card.readAll(kv, userId)).length, 2);
      await Card.delete(kv, userId, card1.id);
      assertEquals((await Card.readAll(kv, userId)).length, 1);
      assertEquals((await CardAttempt.readAll(kv, userId)).length, 1);

      assert((await Card.read(kv, userId, card1.id)).isNone());
      assertEquals(
        (await Card.read(kv, userId, card2.id)).unwrap().id,
        card2.id,
      );
    });
  });

  describe("users", () => {
    it("should create a new user", async () => {
      assertEquals(await User.readAll(kv), []);
      const result = (await User.create(kv, { name: "John Doe" })).unwrap();
      assert(result);
      assertEquals((await User.readAll(kv)).length, 1);
    });

    it("should read a user", async () => {
      const user = (await User.create(kv, { name: "John Doe" })).unwrap();
      assert(user);
      const result = (await User.read(kv, user.id)).unwrap();
      assert(result);
      assertEquals(result.id, user.id);
    });

    it("should read all users", async () => {
      const user1 = (await User.create(kv, { name: "John Doe" })).unwrap();
      const user2 = (await User.create(kv, { name: "Jane Doe" })).unwrap();
      assert(user1);
      assert(user2);

      const results = await User.readAll(kv);
      assertEquals(results.length, 2);
    });

    it("should delete a user", async () => {
      const user = (await User.create(kv, { name: "John Doe" })).unwrap();
      assertEquals((await User.readAll(kv)).length, 1);
      assert(user);
      await User.delete(kv, user.id);
      assertEquals((await User.readAll(kv)).length, 0);
    });
  });

  describe("Cards", () => {
    it("should create a new card", async () => {
      assertEquals(await Card.readAll(kv, userId), []);
      const result = (await Card.create(kv, userId, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      })).unwrap();
      assert(result);
      assertEquals((await Card.readAll(kv, userId)).length, 1);
    });

    it("should read a card", async () => {
      const card = (await Card.create(kv, userId, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      })).unwrap();
      assert(card);
      const result = (await Card.read(kv, userId, card.id)).unwrap();
      assert(result);
      assertEquals(result.id, card.id);
    });

    it("should read all cards", async () => {
      const card1 = (await Card.create(kv, userId, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      })).unwrap();
      const card2 = (await Card.create(kv, userId, {
        question: "What is your phone number?",
        answer: "123-456-7890",
        type: "phone number",
      })).unwrap();
      assert(card1);
      assert(card2);

      const results = await Card.readAll(kv, userId);
      assertEquals(results.length, 2);
    });

    it("should delete a card", async () => {
      const card = (await Card.create(kv, userId, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      })).unwrap();
      assertEquals((await Card.readAll(kv, userId)).length, 1);
      assert(card);
      await Card.delete(kv, userId, card.id);
      assertEquals((await Card.readAll(kv, userId)).length, 0);
    });

    it("should delete all cards for a user", async () => {
      const userId1 = "1";
      const userId2 = "2";

      const card1 = (await Card.create(kv, userId1, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      })).unwrap();
      const card2 = (await Card.create(kv, userId1, {
        question: "What is your phone number?",
        answer: "123-456-7890",
        type: "phone number",
      })).unwrap();
      const card3 = (await Card.create(kv, userId2, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      })).unwrap();
      assert(card1);
      assert(card2);
      assert(card3);

      assertEquals((await Card.readAll(kv, userId1)).length, 2);
      assertEquals((await Card.readAll(kv, userId2)).length, 1);
      await Card.deleteAll(kv, userId1);
      assertEquals((await Card.readAll(kv, userId1)).length, 0);
      assertEquals((await Card.readAll(kv, userId2)).length, 1);
    });
  });

  describe("CardAttempt", () => {
    it("should create a new card attempt with datetime", async () => {
      assertEquals(await CardAttempt.readAll(kv, userId), []);
      const result = (await CardAttempt.create(kv, userId, {
        cardId: "1",
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      assert(result);
      assertEquals((await CardAttempt.readAll(kv, userId)).length, 1);
    });

    it("should create a new card attempt with string", async () => {
      assertEquals(await CardAttempt.readAll(kv, userId), []);
      const result = (await CardAttempt.create(kv, userId, {
        cardId: "1",
        date: Temporal.Now.plainDateTimeISO().toString(),
        correct: true,
      })).unwrap();
      assert(result);
      assertEquals((await CardAttempt.readAll(kv, userId)).length, 1);
    });

    it("should read a card attempt", async () => {
      const cardAttempt = (await CardAttempt.create(kv, userId, {
        cardId: "1",
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      assert(cardAttempt);
      const result = (await CardAttempt.read(kv, userId, cardAttempt.id))
        .unwrap();
      assert(result);
      assertEquals(result.id, cardAttempt.id);
    });

    it("should read all card attempts and sort by date", async () => {
      const cardAttempt1 = (await CardAttempt.create(kv, userId, {
        cardId: "1",
        date: Temporal.PlainDateTime.from("2021-01-01T00:00:00").toString(),
        correct: true,
      })).unwrap();
      const cardAttempt2 = (await CardAttempt.create(kv, userId, {
        cardId: "1",
        date: Temporal.PlainDateTime.from("2021-01-02T00:00:00").toString(),
        correct: true,
      })).unwrap();
      assert(cardAttempt1);
      assert(cardAttempt2);

      const results = await CardAttempt.readAll(kv, userId);
      assertEquals(results.length, 2);

      // Ensure the results are sorted by date with newest first
      assertEquals(results[0].id, cardAttempt2.id);
      assertEquals(results[1].id, cardAttempt1.id);
    });

    it("should read all card attempts for a card ID", async () => {
      const cardId1 = "1";
      const cardId2 = "2";

      const cardAttempt1 = (await CardAttempt.create(kv, userId, {
        cardId: cardId1,
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      const cardAttempt2 = (await CardAttempt.create(kv, userId, {
        cardId: cardId1,
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      const cardAttempt3 = (await CardAttempt.create(kv, userId, {
        cardId: cardId2,
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      assert(cardAttempt1);
      assert(cardAttempt2);
      assert(cardAttempt3);

      const results = await CardAttempt.readAllForCardId(kv, userId, cardId1);
      assertEquals(results.length, 2);
    });

    it("should delete a card attempt", async () => {
      const cardAttempt = (await CardAttempt.create(kv, userId, {
        cardId: "1",
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      assertEquals((await CardAttempt.readAll(kv, userId)).length, 1);
      assert(cardAttempt);
      await CardAttempt.delete(kv, userId, cardAttempt.id);
      assertEquals((await CardAttempt.readAll(kv, userId)).length, 0);
    });

    it("should delete all card attempts for a card ID", async () => {
      const cardId1 = "1";
      const cardId2 = "2";

      const cardAttempt1 = (await CardAttempt.create(kv, userId, {
        cardId: cardId1,
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      const cardAttempt2 = (await CardAttempt.create(kv, userId, {
        cardId: cardId1,
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      const cardAttempt3 = (await CardAttempt.create(kv, userId, {
        cardId: cardId2,
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      assert(cardAttempt1);
      assert(cardAttempt2);
      assert(cardAttempt3);

      assertEquals((await CardAttempt.readAll(kv, userId)).length, 3);
      await CardAttempt.deleteAllForCardId(kv, userId, cardId1);
      assertEquals((await CardAttempt.readAll(kv, userId)).length, 1);
    });

    it("should delete all card attempts for a user", async () => {
      const userId1 = "1";
      const userId2 = "2";

      const cardAttempt1 = (await CardAttempt.create(kv, userId1, {
        cardId: "1",
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      const cardAttempt2 = (await CardAttempt.create(kv, userId1, {
        cardId: "2",
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      const cardAttempt3 = (await CardAttempt.create(kv, userId2, {
        cardId: "1",
        date: Temporal.Now.plainDateTimeISO(),
        correct: true,
      })).unwrap();
      assert(cardAttempt1);
      assert(cardAttempt2);
      assert(cardAttempt3);

      assertEquals((await CardAttempt.readAll(kv, userId1)).length, 2);
      assertEquals((await CardAttempt.readAll(kv, userId2)).length, 1);
      await CardAttempt.deleteAll(kv, userId1);
      assertEquals((await CardAttempt.readAll(kv, userId1)).length, 0);
      assertEquals((await CardAttempt.readAll(kv, userId2)).length, 1);
    });
  });
});
