import { CardAttempt } from "./types.ts";

export function nextAttemptTime(
  attempts: CardAttempt[],
  options?: { unit: Temporal.DateTimeUnit },
): Temporal.PlainDateTime {
  const _accessor = new AttemptsAccessor(
    attempts,
    options ?? { unit: "second" },
  );
  return Temporal.Now.plainDateTimeISO();
}

export class AttemptsAccessor {
  private attempts: CardAttempt[] = [];
  private timeBetweenAttempts: number[] = [];
  private timeBetweenUnit: Temporal.DateTimeUnit = "second";

  constructor(
    attempts: CardAttempt[],
    options?: { unit: Temporal.DateTimeUnit },
  ) {
    this.attempts = sortAttempts(attempts);
    this.timeBetweenUnit = options?.unit ?? this.timeBetweenUnit;
    this.timeBetweenAttempts = timeBetweenManyAttempts(
      this.attempts,
      this.timeBetweenUnit,
    );
  }

  get unit(): Temporal.DateTimeUnit {
    return this.timeBetweenUnit;
  }

  get length(): number {
    return this.attempts.length;
  }

  get timeBetweenLastTwoAttempts(): number | null {
    if (this.length < 2) {
      return null;
    }
    return this.timeBetweenAttempts[0];
  }

  get lastAttemptTime(): Temporal.PlainDateTime | null {
    if (this.length === 0) {
      return null;
    }
    return Temporal.PlainDateTime.from(this.attempts[0].date);
  }

  get isLastAttemptCorrect(): boolean | null {
    if (this.length === 0) {
      return null;
    }
    return this.attempts[0].correct;
  }
}

function sortAttempts(attempts: CardAttempt[]): CardAttempt[] {
  const out = [...attempts];
  return out.sort((a, b) => {
    const dateA = Temporal.PlainDateTime.from(a.date);
    const dateB = Temporal.PlainDateTime.from(b.date);
    return Temporal.PlainDate.compare(dateA, dateB);
  }).reverse();
}

function timeBetweenManyAttempts(
  attempts: CardAttempt[],
  unit: Temporal.DateTimeUnit,
): number[] {
  const out: number[] = [];
  for (let i = 1; i < attempts.length; i++) {
    out.push(timeBetweenAttempts(attempts[i - 1], attempts[i], unit));
  }
  return out;
}
function timeBetweenAttempts(
  attempt1: CardAttempt,
  attempt2: CardAttempt,
  unit: Temporal.DateTimeUnit,
): number {
  const datetime1 = Temporal.PlainDateTime.from(attempt1.date);
  const datetime2 = Temporal.PlainDateTime.from(attempt2.date);
  return datetime1.until(datetime2).total({ unit });
}
