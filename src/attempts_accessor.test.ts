import { describe, it } from "@std/testing/bdd";
import { assertEquals } from "@std/assert";
import { None } from "@oxi/option";

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
    assertEquals(accessor.lastAttemptTime, None);
    assertEquals(accessor.timeBetweenLastTwoAttempts, None);
    assertEquals(accessor.isLastAttemptCorrect, None);
    assertEquals(accessor.isLastThreeCorrectWrongCorrect, None);
    assertEquals(accessor.timeBetweenCorrectAndWrongBeforeLastCorrect, None);
  });

  it("works with one attempt", () => {
    const attempts = [
      { id: "1", cardId, date: today.toString(), correct: false },
    ];
    const accessor = new AttemptsAccessor(attempts);
    assertEquals(accessor.length, 1);
    assertEquals(
      accessor.lastAttemptTime.unwrap().toString(),
      today.toString(),
    );
    assertEquals(accessor.timeBetweenLastTwoAttempts, None);
    assertEquals(accessor.isLastAttemptCorrect.unwrap(), false);
    assertEquals(accessor.isLastThreeCorrectWrongCorrect, None);
    assertEquals(accessor.isLastThreeCorrectWrongCorrect, None);
    assertEquals(accessor.timeBetweenCorrectAndWrongBeforeLastCorrect, None);
  });

  it("works with two attempts", () => {
    const attempts = [
      { id: "1", cardId, date: today.toString(), correct: true },
      {
        id: "2",
        cardId,
        date: today.add({ days: 1 }).toString(),
        correct: true,
      },
    ];

    const accessor = new AttemptsAccessor(attempts, { unit: "day" });

    assertEquals(accessor.length, 2);
    assertEquals(
      accessor.lastAttemptTime.unwrap().toString(),
      today.add({ days: 1 }).toString(),
    );
    assertEquals(accessor.unit, "day");
    assertEquals(accessor.timeBetweenLastTwoAttempts.unwrap(), 1);
    assertEquals(accessor.isLastAttemptCorrect.unwrap(), true);
    assertEquals(accessor.isLastTwoAttemptsCorrect.unwrap(), true);
    assertEquals(accessor.isLastThreeCorrectWrongCorrect, None);
    assertEquals(accessor.timeBetweenCorrectAndWrongBeforeLastCorrect, None);
  });

  it("works for 3+ attempts", () => {
    const attempts = [
      { id: "0", cardId, date: today.toString(), correct: false },
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

    assertEquals(accessor.length, 4);
    assertEquals(
      accessor.lastAttemptTime.unwrap().toString(),
      today.add({ days: 3 }).toString(),
    );
    assertEquals(accessor.unit, "day");
    assertEquals(accessor.timeBetweenLastTwoAttempts.unwrap(), 2);
    assertEquals(accessor.isLastAttemptCorrect.unwrap(), true);
    assertEquals(accessor.isLastTwoAttemptsCorrect.unwrap(), false);
    assertEquals(accessor.isLastThreeCorrectWrongCorrect.unwrap(), true);
    assertEquals(
      accessor.timeBetweenCorrectAndWrongBeforeLastCorrect.unwrap(),
      1,
    );
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
