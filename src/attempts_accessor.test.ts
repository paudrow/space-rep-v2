import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";

import {
  AttemptsAccessor,
  sortAttempts,
  timeBetweenManyAttempts,
} from "./attempts_accesor.ts";

const today = Temporal.Now.plainDateTimeISO();
const cardId = "1";

describe("AttemptsAccessor", () => {
  it("works with no attempts", () => {
    const accessor = new AttemptsAccessor([]);
    assertEquals(accessor.length, 0);
    assertEquals(accessor.lastAttemptTime, null);
    assertEquals(accessor.timeBetweenLastTwoAttempts, null);
    assertEquals(accessor.isLastAttemptCorrect, null);
    assertEquals(accessor.isLastTwoAttemptsIncorrect, null);
  });

  it("works with one attempt", () => {
    const attempts = [
      { id: "1", cardId, date: today.toString(), correct: false },
    ];
    const accessor = new AttemptsAccessor(attempts);
    assertEquals(accessor.length, 1);
    assertEquals(accessor.lastAttemptTime?.toString(), today.toString());
    assertEquals(accessor.timeBetweenLastTwoAttempts, null);
    assertEquals(accessor.isLastAttemptCorrect, false);
    assertEquals(accessor.isLastTwoAttemptsIncorrect, null);
  });

  it("works with more than multiple attempts", () => {
    const attempts = [
      { id: "1", cardId, date: today.toString(), correct: true },
      {
        id: "2",
        cardId,
        date: today.add({ days: 1 }).toString(),
        correct: false,
      },
      {
        id: "3",
        cardId,
        date: today.add({ days: 3 }).toString(),
        correct: true,
      },
    ];
    const accessor = new AttemptsAccessor(attempts, { unit: "day" });

    assertEquals(accessor.length, 3);
    assertEquals(
      accessor.lastAttemptTime?.toString(),
      today.add({ days: 3 }).toString(),
    );
    assertEquals(accessor.unit, "day");
    assertEquals(accessor.timeBetweenLastTwoAttempts, 2);
    assertEquals(accessor.isLastAttemptCorrect, true);
    assertEquals(accessor.isLastTwoAttemptsIncorrect, false);
  });

  it("gives if last two attempts are incorrect", () => {
    const attempts = [
      { id: "1", cardId, date: today.toString(), correct: false },
      {
        id: "2",
        cardId,
        date: today.add({ days: 1 }).toString(),
        correct: false,
      },
      {
        id: "3",
        cardId,
        date: today.add({ days: 3 }).toString(),
        correct: false,
      },
    ];
    const accessor = new AttemptsAccessor(attempts, { unit: "day" });
    assertEquals(accessor.isLastTwoAttemptsIncorrect, true);
  });
});

describe("AttemptsAccesor's helpers", () => {
  describe("timeBetweenManyAttempts", () => {
    it("returns the time between attempts", () => {
      const attempts = [
        {
          id: "3",
          cardId,
          date: today.add({ days: 3 }).toString(),
          correct: true,
        },
        {
          id: "2",
          cardId,
          date: today.add({ days: 1 }).toString(),
          correct: false,
        },
        { id: "1", cardId, date: today.toString(), correct: true },
      ];

      {
        const timeBetween = timeBetweenManyAttempts(attempts, "day");
        assertEquals(timeBetween[0], 2);
        assertEquals(timeBetween[1], 1);
      }

      {
        const timeBetween = timeBetweenManyAttempts(attempts, "hour");
        assertEquals(timeBetween[0], 48);
        assertEquals(timeBetween[1], 24);
      }
    });
  });

  describe("sortAttempts", () => {
    it("sorts attempts by date", () => {
      const attempts = [
        { id: "1", cardId, date: today.toString(), correct: true },
        {
          id: "2",
          cardId,
          date: today.add({ days: 1 }).toString(),
          correct: false,
        },
        {
          id: "3",
          cardId,
          date: today.add({ days: 2 }).toString(),
          correct: true,
        },
      ];

      const sorted = sortAttempts(attempts);
      assertEquals(sorted[0].id, "3");
      assertEquals(sorted[1].id, "2");
      assertEquals(sorted[2].id, "1");

      // Ensure the original array is not modified
      assertEquals(attempts[0].id, "1");
      assertEquals(attempts[1].id, "2");
      assertEquals(attempts[2].id, "3");
    });
  });
});
