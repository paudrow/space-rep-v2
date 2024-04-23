import { describe, it } from "@std/testing/bdd";
import { assertAlmostEquals, assertEquals } from "@std/assert";
import { nextAttemptDateTime } from "../helpers/next_attempt_date_time.ts";
import { CardAttempt } from "../types.ts";

const today = Temporal.Now.plainDateTimeISO();

describe("nextAttemptDateTime", () => {
  it("works with no attempts", () => {
    const nextDateTime = nextAttemptDateTime([]);
    const now = Temporal.Now.plainDateTimeISO();
    const diff =
      now.until(nextDateTime.unwrap(), { largestUnit: "second" }).seconds;
    assertAlmostEquals(diff, 0, 1);
  });

  it("works with one correct attempt", () => {
    const attempts: CardAttempt[] = [
      { id: "1", cardId: "1", date: today.toString(), correct: true },
    ];
    const nextDateTime = nextAttemptDateTime(attempts);

    const tomorrow = today.add({ days: 1 });
    assertEquals(nextDateTime.unwrap().toString(), tomorrow.toString());
  });

  it("works with one incorrect attempt", () => {
    const attempts: CardAttempt[] = [
      {
        id: "1",
        cardId: "1",
        date: today.add({ days: 1 }).toString(),
        correct: false,
      },
    ];
    const nextDateTime = nextAttemptDateTime(attempts);
    assertEquals(
      nextDateTime.unwrap().toString(),
      today.add({ days: 1 }).toString(),
    );
  });

  it("works with two correct attempts", () => {
    const attempts: CardAttempt[] = [
      { id: "1", cardId: "1", date: today.toString(), correct: true },
      {
        id: "2",
        cardId: "1",
        date: today.add({ days: 1 }).toString(),
        correct: true,
      },
    ];
    const nextDateTime = nextAttemptDateTime(attempts);
    assertEquals(
      nextDateTime.unwrap().toString(),
      today.add({ days: 3 }).toString(),
    );
  });

  it("works with two incorrect attempts", () => {
    const attempts: CardAttempt[] = [
      { id: "1", cardId: "1", date: today.toString(), correct: false },
      {
        id: "2",
        cardId: "1",
        date: today.add({ days: 1 }).toString(),
        correct: false,
      },
    ];
    const nextDateTime = nextAttemptDateTime(attempts);
    assertEquals(
      nextDateTime.unwrap().toString(),
      today.add({ days: 1 }).toString(),
    );
  });

  it("works with three attempts, correct, incorrect, correct", () => {
    const attempts: CardAttempt[] = [
      { id: "1", cardId: "1", date: today.toString(), correct: true },
      {
        id: "2",
        cardId: "1",
        date: today.add({ days: 2 }).toString(),
        correct: false,
      },
      {
        id: "3",
        cardId: "1",
        date: today.add({ days: 3 }).toString(),
        correct: true,
      },
    ];
    const nextDateTime = nextAttemptDateTime(attempts);
    assertEquals(
      nextDateTime.unwrap().toString(),
      today.add({ days: 4 }).toString(),
    );
  });

  it("works with two attempts, one correct and one incorrect", () => {
    const attempts: CardAttempt[] = [
      { id: "1", cardId: "1", date: today.toString(), correct: true },
      {
        id: "2",
        cardId: "1",
        date: today.add({ days: 1 }).toString(),
        correct: false,
      },
    ];
    const nextDateTime = nextAttemptDateTime(attempts);
    assertEquals(
      nextDateTime.unwrap().toString(),
      today.add({ days: 1 }).toString(),
    );
  });

  it("works with three attempts, correct, correct, incorrect", () => {
    const attempts: CardAttempt[] = [
      { id: "1", cardId: "1", date: today.toString(), correct: true },
      {
        id: "2",
        cardId: "1",
        date: today.add({ days: 2 }).toString(),
        correct: true,
      },
      {
        id: "3",
        cardId: "1",
        date: today.add({ days: 3 }).toString(),
        correct: false,
      },
    ];
    const nextDateTime = nextAttemptDateTime(attempts);
    assertEquals(
      nextDateTime.unwrap().toString(),
      today.add({ days: 3 }).toString(),
    );
  });

  it("works with three attempts, correct, incorrect, incorrect", () => {
    const attempts: CardAttempt[] = [
      { id: "1", cardId: "1", date: today.toString(), correct: true },
      {
        id: "2",
        cardId: "1",
        date: today.add({ days: 2 }).toString(),
        correct: false,
      },
      {
        id: "3",
        cardId: "1",
        date: today.add({ days: 3 }).toString(),
        correct: false,
      },
    ];
    const nextDateTime = nextAttemptDateTime(attempts);
    assertEquals(
      nextDateTime.unwrap().toString(),
      today.add({ days: 3 }).toString(),
    );
  });

  it("works with three attempts, incorrect, correct, correct", () => {
    const attempts: CardAttempt[] = [
      { id: "1", cardId: "1", date: today.toString(), correct: false },
      {
        id: "2",
        cardId: "1",
        date: today.add({ days: 2 }).toString(),
        correct: true,
      },
      {
        id: "3",
        cardId: "1",
        date: today.add({ days: 3 }).toString(),
        correct: true,
      },
    ];
    const nextDateTime = nextAttemptDateTime(attempts);
    assertEquals(
      nextDateTime.unwrap().toString(),
      today.add({ days: 5 }).toString(),
    );
  });

  it("works for five attempts, correct, incorrect, correct, incorrect, correct", () => {
    const attempts: CardAttempt[] = [
      { id: "1", cardId: "1", date: today.toString(), correct: true },
      {
        id: "2",
        cardId: "1",
        date: today.add({ days: 2 }).toString(),
        correct: false,
      },
      {
        id: "3",
        cardId: "1",
        date: today.add({ days: 3 }).toString(),
        correct: true,
      },
      {
        id: "4",
        cardId: "1",
        date: today.add({ days: 4 }).toString(),
        correct: false,
      },
      {
        id: "5",
        cardId: "1",
        date: today.add({ days: 5 }).toString(),
        correct: true,
      },
    ];
    const nextDateTime = nextAttemptDateTime(attempts);
    assertEquals(
      nextDateTime.unwrap().toString(),
      today.add({ days: 6 }).toString(),
    );
  });
});
