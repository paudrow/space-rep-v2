import { CardAttempt } from "./types.ts";
import { AttemptsAccessor } from "./attempts_accesor.ts";

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
