import {
  Card as CardType,
  CardAttempt as CardAttemptType,
  User as UserType,
} from "./types.ts";
import { Err, Ok, Result } from "@oxi/result";
import { None, Option, Some } from "@oxi/option";

// Paths

function getKvUsersPath(): string[] {
  return ["users"];
}

function getKvUserPath(userId: string): string[] {
  return [...getKvUsersPath(), userId];
}

function getKvCardsPath(userId: string): string[] {
  return [...getKvUserPath(userId), "cards"];
}

function getKvCardPath(userId: string, cardId: string): string[] {
  return [...getKvCardsPath(userId), cardId];
}

function getKvCardAttemptsPath(userId: string): string[] {
  return [...getKvUserPath(userId), "cardAttempts"];
}

function getKvCardAttemptPath(userId: string, attemptId: string): string[] {
  return [...getKvCardAttemptsPath(userId), attemptId];
}

// CRUD

export async function getKv(path?: string): Promise<Deno.Kv> {
  return await Deno.openKv(path);
}

export class Db {
  private constructor() {}

  private User = User;
  private Card = Card;
  private CardAttempt = CardAttempt;

  static get User() {
    return User;
  }
  static get Card() {
    return Card;
  }
  static get CardAttempt() {
    return CardAttempt;
  }
  static reset(kv: Deno.Kv) {
    return resetDb(kv);
  }
}

export class User {
  private constructor() {}

  static async create(
    kv: Deno.Kv,
    user: Omit<UserType, "id"> & { id?: string },
  ): Promise<Result<UserType, string>> {
    if (!user.id) {
      user.id = crypto.randomUUID();
    }
    const value: UserType = {
      id: user.id,
      name: user.name,
    };
    const key = getKvUserPath(value.id);
    const result = await kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, value)
      .commit();
    if (!result.ok) {
      return Err("User not created");
    }
    return Ok(value);
  }

  static async read(kv: Deno.Kv, user: string): Promise<Option<UserType>> {
    const result = await kv.get<UserType>(getKvUserPath(user));
    if (!result.value) {
      return None;
    }
    return Some(result.value);
  }

  static async readAll(kv: Deno.Kv): Promise<UserType[]> {
    const users: UserType[] = [];
    const prefix = getKvUsersPath();
    for await (const { key, value } of kv.list<UserType>({ prefix })) {
      if (key.length === prefix.length + 1) {
        users.push(value);
      }
    }
    return users;
  }

  static async delete(kv: Deno.Kv, user: string) {
    const path = getKvUserPath(user);
    await kv.delete(path);
    await Card.deleteAll(kv, user);
  }
}

export class Card {
  private constructor() {}

  static async create(
    kv: Deno.Kv,
    userId: string,
    card: Omit<CardType, "id"> & { id?: string },
  ): Promise<Result<CardType, string>> {
    if (!card.id) {
      card.id = crypto.randomUUID();
    }
    const value: CardType = {
      id: card.id,
      question: card.question,
      hint: card.hint,
      answer: card.answer,
      type: card.type,
    };
    const key = getKvCardPath(userId, value.id);
    const result = await kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, card)
      .commit();
    if (!result.ok) {
      return Err("Card not created");
    }
    return Ok(value);
  }

  static async read(
    kv: Deno.Kv,
    userId: string,
    cardId: string,
  ): Promise<Option<CardType>> {
    const result = await kv.get<CardType>(getKvCardPath(userId, cardId));
    if (!result.value) {
      return None;
    }
    return Some(result.value);
  }

  static async readAll(kv: Deno.Kv, userId: string): Promise<CardType[]> {
    const cards: CardType[] = [];
    for await (
      const { value } of kv.list<CardType>({ prefix: getKvCardsPath(userId) })
    ) {
      cards.push(value);
    }
    return cards;
  }

  static async delete(kv: Deno.Kv, userId: string, cardId: string) {
    const path = getKvCardPath(userId, cardId);
    await kv.delete(path);
    await CardAttempt.deleteAllForCardId(kv, userId, cardId);
  }

  static async deleteAll(kv: Deno.Kv, userId: string) {
    for await (
      const { key, value: card } of kv.list<CardType>({
        prefix: getKvCardsPath(userId),
      })
    ) {
      await kv.delete(key);
      await CardAttempt.deleteAllForCardId(kv, userId, card.id);
    }
  }
}

export class CardAttempt {
  private constructor() {}

  static async create(
    kv: Deno.Kv,
    userId: string,
    attempt: Omit<CardAttemptType, "id" | "date"> & {
      id?: string;
      date?: Temporal.PlainDateTime | string;
    },
  ): Promise<Result<CardAttemptType, string>> {
    if (!attempt.id) {
      attempt.id = crypto.randomUUID();
    }
    if (!attempt.date) {
      attempt.date = Temporal.Now.plainDateTimeISO();
    } else if (typeof attempt.date === "string") {
      attempt.date = Temporal.PlainDateTime.from(attempt.date);
    }
    const value: CardAttemptType = {
      id: attempt.id,
      cardId: attempt.cardId,
      date: attempt.date.toString(),
      correct: attempt.correct,
    };
    const key = getKvCardAttemptPath(userId, value.id);
    const result = await kv.set(key, value);
    if (!result.ok) {
      return Err("Card attempt not created");
    }
    return Ok(value);
  }

  static async read(
    kv: Deno.Kv,
    userId: string,
    attemptId: string,
  ): Promise<Option<CardAttemptType>> {
    const result = await kv.get<CardAttemptType>(
      getKvCardAttemptPath(userId, attemptId),
    );
    if (!result.value) {
      return None;
    }
    return Some(result.value);
  }

  static async readAll(
    kv: Deno.Kv,
    userId: string,
  ): Promise<CardAttemptType[]> {
    const attempts: CardAttemptType[] = [];
    for await (
      const { value } of kv.list<CardAttemptType>({
        prefix: getKvCardAttemptsPath(userId),
      })
    ) {
      attempts.push(value);
    }
    attempts.sort((a, b) => {
      const dateA = Temporal.PlainDateTime.from(a.date);
      const dateB = Temporal.PlainDateTime.from(b.date);
      return Temporal.PlainDate.compare(dateA, dateB);
    }).reverse();
    return attempts;
  }

  static async readAllForCardId(
    kv: Deno.Kv,
    userId: string,
    cardId: string,
  ): Promise<CardAttemptType[]> {
    const attempts: CardAttemptType[] = [];
    for await (
      const { value } of kv.list<CardAttemptType>({
        prefix: getKvCardAttemptsPath(userId),
      })
    ) {
      if (value.cardId === cardId) {
        attempts.push(value);
      }
    }
    return attempts;
  }

  static async delete(
    kv: Deno.Kv,
    userId: string,
    attemptId: string,
  ) {
    const path = getKvCardAttemptPath(userId, attemptId);
    await kv.delete(path);
  }

  static async deleteAll(
    kv: Deno.Kv,
    userId: string,
  ) {
    for await (
      const { key } of kv.list({ prefix: getKvCardAttemptsPath(userId) })
    ) {
      await kv.delete(key);
    }
  }

  static async deleteAllForCardId(
    kv: Deno.Kv,
    userId: string,
    cardId: string,
  ) {
    for await (
      const { key, value } of kv.list<CardAttemptType>({
        prefix: getKvCardAttemptsPath(userId),
      })
    ) {
      if (value.cardId === cardId) {
        await kv.delete(key);
      }
    }
  }
}

// Utils

export async function resetDb(kv: Deno.Kv) {
  for await (const { key } of kv.list({ prefix: [] })) {
    await kv.delete(key);
  }
}
