
type CardType = "text" | "phone";

interface User {
  id: string;
  name: string;
}

function newUser(args: { id?: string; name: string }): User {
  if (!args.id) {
    args.id = crypto.randomUUID();
  }
  return { id: args.id, name: args.name };
}

interface Card {
  id: string;
  question: string;
  hint?: string;
  answer: string;
  type: CardType;
}

function newCard(
  args: {
    id?: string;
    question: string;
    hint?: string;
    answer: string;
    type: CardType;
  },
): Card {
  if (!args.id) {
    args.id = crypto.randomUUID();
  }
  return {
    id: args.id,
    question: args.question,
    hint: args.hint,
    answer: args.answer,
    type: args.type,
  };
}


interface CardAttempt {
  id: string;
  cardId: string;
  date: string;
  correct: boolean;
}

function attemptAnswer(card: Card, answer: string): CardAttempt {
  const correct = isAnswerToCardCorrect(card, answer);
  const date = Temporal.Now.plainDateTimeISO().toString();
  return { id: crypto.randomUUID(), cardId: card.id, date, correct };
}

// Card answer checker

function isAnswerToCardCorrect(card: Card, answer: string): boolean {
  switch (card.type) {
    case "text":
      return isTextMatches(card.answer, answer);
    case "phone":
      return isPhoneNumberMatches(card.answer, answer);
    default:
      throw new Error(`Unknown card type: ${card.type}`);
  }
}

function isTextMatches(expected: string, actual: string): boolean {
  return expected.toLowerCase() === actual.toLowerCase();
}

function isPhoneNumberMatches(expected: string, actual: string): boolean {
  return expected.replace(/\D/g, "") === actual.replace(/\D/g, "");
}

// Database

/// Paths

function getDbUserPath(user: string): string[] {
  return ['users', user];
}

function getDbCardsPath(user: string): string[] {
  return [...getDbUserPath(user), 'cards'];
}

function getDbCardPath(user: string, cardId: string): string[] {
  return [...getDbCardsPath(user), cardId];
}

function getDbCardAttemptsPath(user: string): string[] {
  return [...getDbUserPath(user), 'cardAttempts']
}

function getDbCardAttemptPath(user: string, attemptId: string): string[] {
  return [...getDbCardAttemptsPath(user), attemptId];
}

/// Database actions

async function createUser(db: Deno.Kv, user: User): Promise<boolean> {
  const key = getDbUserPath(user.id);
  const result = await db.atomic()
    .check({key, versionstamp: null})
    .set(key, user)
    .commit();
  return result.ok
}

async function getUser(db: Deno.Kv, user: string): Promise<User | null> {
  const result = await db.get<User>(getDbUserPath(user));
  return result.value;
}

async function getCard(db: Deno.Kv, user: string, cardId: string): Promise<Card | null> {
  const result = await db.get<Card>(getDbCardPath(user, cardId));
  return result.value;
}

async function getCards(db: Deno.Kv, user: string): Promise<Card[]> {
  const cards: Card[] = [];
  for await (const {value} of db.list<Card>({prefix: getDbCardsPath(user)})) {
    cards.push(value);
  }
  return cards;
}

async function getCardAttempt(db: Deno.Kv, user: string, attemptId: string): Promise<CardAttempt | null> {
  const result = await db.get<CardAttempt>(getDbCardAttemptPath(user, attemptId));
  return result.value;
}

async function getCardAttempts(db: Deno.Kv, user: string): Promise<CardAttempt[]> {
  const attempts: CardAttempt[] = [];
  for await (const {value} of db.list<CardAttempt>({prefix: getDbCardAttemptsPath(user)})) {
    attempts.push(value);
  }
  return attempts;
}

async function getCardAttemptsForCard(db: Deno.Kv, user: string, cardId: string): Promise<CardAttempt[]> {
  const attempts: CardAttempt[] = [];
  for await (const {value} of db.list<CardAttempt>({prefix: getDbCardAttemptsPath(user)})) {
    if (value.cardId === cardId) {
      attempts.push(value);
    }
  }
  return attempts;
}

async function resetDb(db: Deno.Kv) {
  for await (const {key} of db.list({prefix: []})) {
    await db.delete(key);
  }
}


if (import.meta.main) {

  const db = await Deno.openKv()
  const user = newUser({name: "John Doe"});
  const cards: Card[] = [
    newCard({
      id: "1",
      question: "What is your name?",
      answer: "John Doe",
      type: "text",
    }),
    newCard({
      id: "2",
      question: "What is your phone number?",
      answer: "123-456-7890",
      type: "phone",
    }),
  ];

  const userId = user.id;
  for (const card of cards) {
    const key = getDbCardPath(userId, card.id);
    const result = await db.atomic()
      .check({key, versionstamp: null})
      .set(key, card)
      .commit();
    if (result.ok) {
      console.log("Value set successfully");
    } else {
      console.error("Key already exists: ", key);
    }
  }

  const card = cards[1];
  // const answer = "Jane Doe";
  // const attempt = attemptAnswer(card, answer);
  // const key = getDbCardAttemptPath(userId, attempt.id);
  // const result = await db.set(key, attempt);
  // if (result) {
  //   console.log("Attempt set successfully");
  // } else {
  //   console.error("Attempt already exists: ", key);
  // }

  // // get all attempts
  // for await (const {key, value} of db.list({prefix: getDbCardAttemptsPath(userId)})) {
  //   console.log(key, value);
  // }

  // await resetDb(db);
}
