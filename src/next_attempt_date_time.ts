import { CardAttempt } from "./types.ts";
import { AttemptsAccessor } from "./attempts_accesor.ts";
import { Err, Ok, Result } from "@oxi/result";

export function nextAttemptDateTime(
  attempts: CardAttempt[],
  options?: {
    unit: Temporal.DateTimeUnit;
    minAddOnCorrect: Temporal.Duration;
    scalerOnTwoCorrect: number;
    scalarOnCorrectWrongCorrect: number;
  },
): Result<Temporal.PlainDateTime, string> {
  const unit = options?.unit ?? "day";
  // make a temporal turation of 1 day
  const minAddOnCorrect = options?.minAddOnCorrect ??
    Temporal.Duration.from({ days: 1 });
  const scalerOnTwoCorrect = options?.scalerOnTwoCorrect ?? 2;
  const scalarOnCorrectWrongCorrect = options?.scalarOnCorrectWrongCorrect ??
    0.5;

  const accessor = new AttemptsAccessor(
    attempts,
    { unit },
  );

  // If there are no attempts, return the current time
  if (accessor.length === 0) {
    return Ok(Temporal.Now.plainDateTimeISO());
  }

  // If the last attempt was incorrect, return the current time
  const lastAttemptTimeOption = accessor.lastAttemptTime;
  if (lastAttemptTimeOption.isNone()) {
    return Err("Expected lastAttemptTime to be set but it was None");
  }
  const lastAttemptTime = lastAttemptTimeOption.unwrap();

  const isLastAttemptCorrectOption = accessor.isLastAttemptCorrect;
  if (isLastAttemptCorrectOption.isNone()) {
    return Err("Expected isLastAttemptCorrect to be set but it was None");
  }
  const isLastAttemptCorrect = isLastAttemptCorrectOption.unwrap();

  if (!isLastAttemptCorrect) {
    return Ok(lastAttemptTime);
  }

  // If there is only one correct attempt, return the current time plus the minimum add on time
  if (accessor.length === 1) {
    const nextAttempt = lastAttemptTime.add(minAddOnCorrect);
    return Ok(nextAttempt);
  }

  // If the last two attempts were correct, return the current time plus the scaled time between the last two attempts
  const isLastTwoBothCorrectOption = accessor.isLastTwoAttemptsCorrect;
  if (isLastTwoBothCorrectOption.isNone()) {
    return Err("Expected isLastTwoBothCorrect to be set but it was None");
  }
  const isLastTwoBothCorrect = isLastTwoBothCorrectOption.unwrap();

  if (isLastTwoBothCorrect) {
    const timeBetweenLastTwoAttemptsOption =
      accessor.timeBetweenLastTwoAttempts;
    if (timeBetweenLastTwoAttemptsOption.isNone()) {
      return Err(
        "Expected timeBetweenLastTwoAttempts to be set but it was None",
      );
    }
    const timeBetweenLastTwoAttempts = timeBetweenLastTwoAttemptsOption
      .unwrap();

    const scaledAmount = Temporal.Duration.from({
      [unit + "s"]: Math.floor(timeBetweenLastTwoAttempts * scalerOnTwoCorrect),
    });
    const addAmount =
      Temporal.Duration.compare(scaledAmount, minAddOnCorrect) === -1
        ? minAddOnCorrect
        : scaledAmount;
    const nextAttempt = lastAttemptTime.add(addAmount);
    return Ok(nextAttempt);
  }

  // If the last three attempts were correct -> wrong -> correct, return the current time plus the scaled time between the last correct and wrong attempts
  const isLastThreeCorrectWrongCorrectOption =
    accessor.isLastThreeCorrectWrongCorrect;
  if (isLastThreeCorrectWrongCorrectOption.isNone()) {
    return Err(
      "Expected isLastThreeCorrectWrongCorrect to be set but it was None",
    );
  }
  const isLastThreeCorrectWrongCorrect = isLastThreeCorrectWrongCorrectOption
    .unwrap();

  if (isLastThreeCorrectWrongCorrect) {
    const timeBetweenCorrectAndWrongBeforeLastCorrectOption =
      accessor.timeBetweenCorrectAndWrongBeforeLastCorrect;
    if (timeBetweenCorrectAndWrongBeforeLastCorrectOption.isNone()) {
      return Err(
        "Expected timeBetweenCorrectAndWrongBeforeLastCorrect to be set but it was None",
      );
    }
    const timeBetweenCorrectAndWrongBeforeLastCorrect =
      timeBetweenCorrectAndWrongBeforeLastCorrectOption.unwrap();

    const scaledAmountToAdd = Temporal.Duration.from({
      [unit + "s"]: Math.floor(
        timeBetweenCorrectAndWrongBeforeLastCorrect *
          scalarOnCorrectWrongCorrect,
      ),
    });
    const addAmount =
      Temporal.Duration.compare(scaledAmountToAdd, minAddOnCorrect) === -1
        ? minAddOnCorrect
        : scaledAmountToAdd;
    const nextAttempt = lastAttemptTime.add(addAmount);
    return Ok(nextAttempt);
  }

  // If no case matched, return an error
  return Err("No case matched in nextAttemptDateTime function");
}
