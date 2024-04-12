import {
  Card as CardType,
  CardAttempt as CardAttemptType,
  User as UserType,
} from "./types.ts";

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
  ): Promise<UserType | null> {
    if (!user.id) {
      user.id = crypto.randomUUID();
    }
    const key = getKvUserPath(user.id);
    const result = await kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, user)
      .commit();
    return result.ok ? user as UserType : null;
  }

  static async read(kv: Deno.Kv, user: string): Promise<UserType | null> {
    const result = await kv.get<UserType>(getKvUserPath(user));
    return result.value;
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
  ): Promise<CardType | null> {
    if (!card.id) {
      card.id = crypto.randomUUID();
    }
    const key = getKvCardPath(userId, card.id);
    const result = await kv.atomic()
      .check({ key, versionstamp: null })
      .set(key, card)
      .commit();
    return result.ok ? card as CardType : null;
  }

  static async read(
    kv: Deno.Kv,
    userId: string,
    cardId: string,
  ): Promise<CardType | null> {
    const result = await kv.get<CardType>(getKvCardPath(userId, cardId));
    return result.value;
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
    attempt: Omit<CardAttemptType, "id"> & { id?: string },
  ): Promise<CardAttemptType | null> {
    if (!attempt.id) {
      attempt.id = crypto.randomUUID();
    }
    const key = getKvCardAttemptPath(userId, attempt.id);
    const result = await kv.set(key, attempt);
    return result.ok ? attempt as CardAttemptType : null;
  }

  static async read(
    kv: Deno.Kv,
    userId: string,
    attemptId: string,
  ): Promise<CardAttemptType | null> {
    const result = await kv.get<CardAttemptType>(
      getKvCardAttemptPath(userId, attemptId),
    );
    return result.value;
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
