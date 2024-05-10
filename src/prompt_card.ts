import { Card } from "./types.ts";
import { Err, Ok, Result } from "@oxi/result";

export function askCard(_card: Card): boolean {
  return true;
}

// Card answer checker

export function isAnswerToCardCorrect(card: Card, guess: string): boolean {
  const answer = card.answer;
  switch (card.type) {
    case "text":
      return isTextMatches(answer, guess);
    case "number":
      throw Number(answer) === Number(guess);
    case "phone number":
      return isPhoneNumberMatches(answer, guess);
    case "true or false":
      throw new Error("Not implemented");
    default:
      throw new Error(`Unknown card type: ${card.type}`);
  }
}

export function isTrueOrFalseMatches(
  expected: string,
  actual: string,
): Result<boolean, string> {
  const expectedBoolResult = textToTrueOrFalse(expected);
  if (expectedBoolResult.isErr()) {
    return expectedBoolResult;
  }
  const expectedBool = expectedBoolResult.unwrap();

  const actualBoolResult = textToTrueOrFalse(actual);
  if (actualBoolResult.isErr()) {
    return actualBoolResult;
  }
  const actualBool = actualBoolResult.unwrap();
  return Ok(expectedBool === actualBool);
}

export function textToTrueOrFalse(text: string): Result<boolean, string> {
  const t = text.toLowerCase();
  if (t === "true" || t === "t" || t === "yes" || t === "y") {
    return Ok(true);
  } else if (t === "false" || t === "f" || t === "no" || t === "n") {
    return Ok(false);
  } else {
    return Err(`Value was not true or false: ${text}`);
  }
}

export function isTextMatches(
  expected: string,
  actual: string,
): Result<boolean, string> {
  if (actual.trim() === "") {
    return Err("Expected text was empty");
  }
  return Ok(expected.toLowerCase() === actual.toLowerCase());
}

export function isPhoneNumberMatches(
  expected: string,
  actual: string,
): Result<boolean, string> {
  const expectedNumbersOnly = expected.replace(/\D/g, "");
  const actualNumbersOnly = actual.replace(/\D/g, "");
  if (actualNumbersOnly.length === 0) {
    return Err("Expected phone number was empty");
  }
  return Ok(expectedNumbersOnly === actualNumbersOnly);
}

if (import.meta.main) {
  const card: Card = {
    question: "What is the capital of France?",
    answer: "Paris",
    type: "text",
    id: "1",
  };
  askCard(card);
}
