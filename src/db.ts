import {
  Card as CardType,
  CardAttempt as CardAttemptType,
  User as UserType,
} from "./types.ts";

// Paths

function getDbUsersPath(): string[] {
  return ["users"];
}

function getDbUserPath(userId: string): string[] {
  return [...getDbUsersPath(), userId];
}

function getDbCardsPath(userId: string): string[] {
  return [...getDbUserPath(userId), "cards"];
}

function getDbCardPath(userId: string, cardId: string): string[] {
  return [...getDbCardsPath(userId), cardId];
}

function getDbCardAttemptsPath(userId: string): string[] {
  return [...getDbUserPath(userId), "cardAttempts"];
}

function getDbCardAttemptPath(userId: string, attemptId: string): string[] {
  return [...getDbCardAttemptsPath(userId), attemptId];
}

// CRUD

export class User {
  private constructor() {}

  static async create(
    db: Deno.Kv,
    user: Omit<UserType, "id"> & { id?: string },
  ): Promise<UserType | null> {
    if (!user.id) {
      user.id = crypto.randomUUID();
    }
    const key = getDbUserPath(user.id);
    const result = await db.atomic()
      .check({ key, versionstamp: null })
      .set(key, user)
      .commit();
    return result.ok ? user as UserType : null;
  }

  static async read(db: Deno.Kv, user: string): Promise<User | null> {
    const result = await db.get<User>(getDbUserPath(user));
    return result.value;
  }

  static async readAll(db: Deno.Kv): Promise<User[]> {
    const users: User[] = [];
    for await (const { value } of db.list<User>({ prefix: ["users"] })) {
      users.push(value);
    }
    return users;
  }

  static async delete(db: Deno.Kv, user: string) {
    const path = getDbUserPath(user);
    await db.delete(path);
    await Card.deleteAll(db, user);
  }
}

export class Card {
  private constructor() {}

  static async create(
    db: Deno.Kv,
    userId: string,
    card: Omit<CardType, "id"> & { id?: string },
  ): Promise<CardType | null> {
    if (!card.id) {
      card.id = crypto.randomUUID();
    }
    const key = getDbCardPath(userId, card.id);
    const result = await db.atomic()
      .check({ key, versionstamp: null })
      .set(key, card)
      .commit();
    return result.ok ? card as CardType : null;
  }

  static async read(
    db: Deno.Kv,
    userId: string,
    cardId: string,
  ): Promise<CardType | null> {
    const result = await db.get<CardType>(getDbCardPath(userId, cardId));
    return result.value;
  }

  static async readAll(db: Deno.Kv, userId: string): Promise<CardType[]> {
    const cards: CardType[] = [];
    for await (
      const { value } of db.list<CardType>({ prefix: getDbCardsPath(userId) })
    ) {
      cards.push(value);
    }
    return cards;
  }

  static async delete(db: Deno.Kv, userId: string, cardId: string) {
    const path = getDbCardPath(userId, cardId);
    await db.delete(path);
    await CardAttempt.deleteAllForCardId(db, userId, cardId);
  }

  static async deleteAll(db: Deno.Kv, userId: string) {
    for await (
      const { key, value: card } of db.list<CardType>({
        prefix: getDbCardsPath(userId),
      })
    ) {
      await db.delete(key);
      await CardAttempt.deleteAllForCardId(db, userId, card.id);
    }
  }
}

export class CardAttempt {
  private constructor() {}

  static async create(
    db: Deno.Kv,
    userId: string,
    attempt: Omit<CardAttemptType, "id"> & { id?: string },
  ): Promise<CardAttemptType | null> {
    if (!attempt.id) {
      attempt.id = crypto.randomUUID();
    }
    const key = getDbCardAttemptPath(userId, attempt.id);
    const result = await db.set(key, attempt);
    return result.ok ? attempt as CardAttemptType : null;
  }

  static async read(
    db: Deno.Kv,
    userId: string,
    attemptId: string,
  ): Promise<CardAttemptType | null> {
    const result = await db.get<CardAttemptType>(
      getDbCardAttemptPath(userId, attemptId),
    );
    return result.value;
  }

  static async readAll(
    db: Deno.Kv,
    userId: string,
  ): Promise<CardAttemptType[]> {
    const attempts: CardAttemptType[] = [];
    for await (
      const { value } of db.list<CardAttemptType>({
        prefix: getDbCardAttemptsPath(userId),
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
    db: Deno.Kv,
    userId: string,
    cardId: string,
  ): Promise<CardAttemptType[]> {
    const attempts: CardAttemptType[] = [];
    for await (
      const { value } of db.list<CardAttemptType>({
        prefix: getDbCardAttemptsPath(userId),
      })
    ) {
      if (value.cardId === cardId) {
        attempts.push(value);
      }
    }
    return attempts;
  }

  static async delete(
    db: Deno.Kv,
    userId: string,
    attemptId: string,
  ) {
    const path = getDbCardAttemptPath(userId, attemptId);
    await db.delete(path);
  }

  static async deleteAll(
    db: Deno.Kv,
    userId: string,
  ) {
    for await (
      const { key } of db.list({ prefix: getDbCardAttemptsPath(userId) })
    ) {
      await db.delete(key);
    }
  }

  static async deleteAllForCardId(
    db: Deno.Kv,
    userId: string,
    cardId: string,
  ) {
    for await (
      const { key, value } of db.list<CardAttemptType>({
        prefix: getDbCardAttemptsPath(userId),
      })
    ) {
      if (value.cardId === cardId) {
        await db.delete(key);
      }
    }
  }
}

// Utils

export async function resetDb(db: Deno.Kv) {
  for await (const { key } of db.list({ prefix: [] })) {
    await db.delete(key);
  }
}
