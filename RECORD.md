# RECORD

## 2024-04-10

I refactored the types and db. I started testing the DB.

Next steps are to finish testing the DB.

Also, I should:

- [ ] Setup CI
- [ ] Add readme
- [ ] Make emailer code

## 2024-04-09

What is the goal?

A Deno application that can work as a configurable Anki interface?

Features

- Has questions and answers
- Remembers past attempts
- Schedules cards based on if you're correct or not: correct => distance * 2,
  incorrect => distance / 2
- Prioritizes cards that haven't been asked in the longest time
- Frontend agnostic
- Uses DenoKV, but abstracts it
- Persistent storage in database

What information do I need for cards?

- Question
- Answer
- Record

What type of questions could I have?

- Multiple choice (ideally mix up options)
- Enter the answer with text check
- Short entry and user reports it correct or not

For now, let me focus on textual comparisson.

---

Okay, so I have done some things.

What have I done?

- Created fundamental types, functions to check correctness, and basic database
  interface

What is next?

- Add tests
- Add the ability to sort attempts by date
- Implement a simple Anki algorithm using the defined types
