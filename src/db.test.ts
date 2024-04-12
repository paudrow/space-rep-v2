import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { assert, assertEquals } from "@std/assert";
import { Card, CardAttempt, User } from "./db.ts";

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

  describe("integration", () => {
    it("should delete a user and all related cards", async () => {
      const user1 = await User.create(db, { name: "John Doe" });
      const user2 = await User.create(db, { name: "Jane Doe" });

      assert(user1);
      assert(user2);

      const card1 = await Card.create(db, user1.id, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      });
      const card2 = await Card.create(db, user1.id, {
        question: "What is your phone number?",
        answer: "123-456-7890",
        type: "phone",
      });
      const card3 = await Card.create(db, user2.id, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      });
      assert(card1);
      assert(card2);
      assert(card3);

      assertEquals((await User.readAll(db)).length, 2);
      assertEquals((await Card.readAll(db, user1.id)).length, 2);
      assertEquals((await Card.readAll(db, user2.id)).length, 1);
      await User.delete(db, user1.id);
      assertEquals((await User.readAll(db)).length, 1);
      assertEquals((await Card.readAll(db, user1.id)).length, 0);
      assertEquals((await Card.readAll(db, user2.id)).length, 1);
    });

    it("should delete a card and related card attempts", async () => {
      const card1 = await Card.create(db, userId, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      });
      const card2 = await Card.create(db, userId, {
        question: "What is your phone number?",
        answer: "123-456-7890",
        type: "phone",
      });
      assert(card1);
      assert(card2);

      await CardAttempt.create(db, userId, {
        cardId: card1.id,
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      await CardAttempt.create(db, userId, {
        cardId: card2.id,
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      assertEquals((await CardAttempt.readAll(db, userId)).length, 2);

      assertEquals((await Card.readAll(db, userId)).length, 2);
      await Card.delete(db, userId, card1.id);
      assertEquals((await Card.readAll(db, userId)).length, 1);
      assertEquals((await CardAttempt.readAll(db, userId)).length, 1);

      assertEquals(await Card.read(db, userId, card1.id), null);
      assertEquals((await Card.read(db, userId, card2.id))?.id, card2.id);
    });
  });

  describe("users", () => {
    it("should create a new user", async () => {
      assertEquals(await User.readAll(db), []);
      const result = await User.create(db, { name: "John Doe" });
      assert(result);
      assertEquals((await User.readAll(db)).length, 1);
    });

    it("should read a user", async () => {
      const user = await User.create(db, { name: "John Doe" });
      assert(user);
      const result = await User.read(db, user.id);
      assert(result);
      assertEquals(result.id, user.id);
    });

    it("should read all users", async () => {
      const user1 = await User.create(db, { name: "John Doe" });
      const user2 = await User.create(db, { name: "Jane Doe" });
      assert(user1);
      assert(user2);

      const results = await User.readAll(db);
      assertEquals(results.length, 2);
    });

    it("should delete a user", async () => {
      const user = await User.create(db, { name: "John Doe" });
      assertEquals((await User.readAll(db)).length, 1);
      assert(user);
      await User.delete(db, user.id);
      assertEquals((await User.readAll(db)).length, 0);
    });
  });

  describe("Cards", () => {
    it("should create a new card", async () => {
      assertEquals(await Card.readAll(db, userId), []);
      const result = await Card.create(db, userId, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      });
      assert(result);
      assertEquals((await Card.readAll(db, userId)).length, 1);
    });

    it("should read a card", async () => {
      const card = await Card.create(db, userId, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      });
      assert(card);
      const result = await Card.read(db, userId, card.id);
      assert(result);
      assertEquals(result.id, card.id);
    });

    it("should read all cards", async () => {
      const card1 = await Card.create(db, userId, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      });
      const card2 = await Card.create(db, userId, {
        question: "What is your phone number?",
        answer: "123-456-7890",
        type: "phone",
      });
      assert(card1);
      assert(card2);

      const results = await Card.readAll(db, userId);
      assertEquals(results.length, 2);
    });

    it("should delete a card", async () => {
      const card = await Card.create(db, userId, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      });
      assertEquals((await Card.readAll(db, userId)).length, 1);
      assert(card);
      await Card.delete(db, userId, card.id);
      assertEquals((await Card.readAll(db, userId)).length, 0);
    });

    it("should delete all cards for a user", async () => {
      const userId1 = "1";
      const userId2 = "2";

      const card1 = await Card.create(db, userId1, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      });
      const card2 = await Card.create(db, userId1, {
        question: "What is your phone number?",
        answer: "123-456-7890",
        type: "phone",
      });
      const card3 = await Card.create(db, userId2, {
        question: "What is your name?",
        answer: "John Doe",
        type: "text",
      });
      assert(card1);
      assert(card2);
      assert(card3);

      assertEquals((await Card.readAll(db, userId1)).length, 2);
      assertEquals((await Card.readAll(db, userId2)).length, 1);
      await Card.deleteAll(db, userId1);
      assertEquals((await Card.readAll(db, userId1)).length, 0);
      assertEquals((await Card.readAll(db, userId2)).length, 1);
    });
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

    it("should read all card attempts for a card ID", async () => {
      const cardId1 = "1";
      const cardId2 = "2";

      const cardAttempt1 = await CardAttempt.create(db, userId, {
        cardId: cardId1,
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      const cardAttempt2 = await CardAttempt.create(db, userId, {
        cardId: cardId1,
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      const cardAttempt3 = await CardAttempt.create(db, userId, {
        cardId: cardId2,
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      assert(cardAttempt1);
      assert(cardAttempt2);
      assert(cardAttempt3);

      const results = await CardAttempt.readAllForCardId(db, userId, cardId1);
      assertEquals(results.length, 2);
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

    it("should delete all card attempts for a card ID", async () => {
      const cardId1 = "1";
      const cardId2 = "2";

      const cardAttempt1 = await CardAttempt.create(db, userId, {
        cardId: cardId1,
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      const cardAttempt2 = await CardAttempt.create(db, userId, {
        cardId: cardId1,
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      const cardAttempt3 = await CardAttempt.create(db, userId, {
        cardId: cardId2,
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      assert(cardAttempt1);
      assert(cardAttempt2);
      assert(cardAttempt3);

      assertEquals((await CardAttempt.readAll(db, userId)).length, 3);
      await CardAttempt.deleteAllForCardId(db, userId, cardId1);
      assertEquals((await CardAttempt.readAll(db, userId)).length, 1);
    });

    it("should delete all card attempts for a user", async () => {
      const userId1 = "1";
      const userId2 = "2";

      const cardAttempt1 = await CardAttempt.create(db, userId1, {
        cardId: "1",
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      const cardAttempt2 = await CardAttempt.create(db, userId1, {
        cardId: "2",
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      const cardAttempt3 = await CardAttempt.create(db, userId2, {
        cardId: "1",
        date: Temporal.Now.plainDateISO().toString(),
        correct: true,
      });
      assert(cardAttempt1);
      assert(cardAttempt2);
      assert(cardAttempt3);

      assertEquals((await CardAttempt.readAll(db, userId1)).length, 2);
      assertEquals((await CardAttempt.readAll(db, userId2)).length, 1);
      await CardAttempt.deleteAll(db, userId1);
      assertEquals((await CardAttempt.readAll(db, userId1)).length, 0);
      assertEquals((await CardAttempt.readAll(db, userId2)).length, 1);
    });
  });
});
