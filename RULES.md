# Rules for writing questions, concepts and cheat sheets

Examples are in English; write the actual questions in the language of the material.

These rules were collected during real studying: each one came from a specific complaint of the form "this question doesn't help". Follow all of them. If the project has its own rules (`CLAUDE.md` or `RULES.md` in the project folder), they take precedence over these.

## 0. The main thing: tasks for memorizing, not for testing

- The goal is to **memorize** the theory, not to "catch" the learner making a mistake. Therefore:
  - repeat the same definition **as often as possible** in different simple formats;
  - give definitions as **full sentences from the material**, worded exactly as in the source;
  - explanations are **detailed**, don't skimp: repeat the whole definition, explain why the other options don't fit, link to neighboring concepts;
  - make questions on **every item** of lists and classifications. If there are 4 stages, ask about each stage, not just one as an example.
- **A budget, not "everything three times".** The bank must not bloat. Guideline: a large topic has **about 150 questions**, a small one **about 75**, i.e. ~10–20 per lesson and **3–5 per microtopic**. This is a guideline, not a limit: don't throw out something important to hit the number, but don't keep extras either. A microtopic contains:
  - 1 "match" with 3–5 pairs, covering all definitions of the microtopic at once;
  - 1–2 "choose": the key definition, or "choose all correct" for a list;
  - 1 "true/false" or "sort / order", if there are groups or a sequence;
  - 1 free-answer question: "fill in", "list" or "recall".
- **Pack, don't split:** a list gets one "choose all" + one "list", not a question per item; all formulas of a lesson get one "match metric to formula" + "fill in" for the 2–3 main ones.
- **Ask about the main things, put details in explanations:** key definitions, frameworks, stages, formulas go into questions; pros and cons, secondary items, nuances go inside "choose all", "match" and the explanation text.
- **No mirror duplicates:** don't ask the same definition both as "what is X" and as "which concept is defined this way". Repetition for memorizing is provided by the trainer itself: mistakes come back in later tests.
- **Formulas** everywhere they appear in the material: first in a simple format ("choose the correct formula", "match metric to formula"), then "fill in part of the formula" and "recall the formula".

## 1. The goal is to learn the theory

- Questions test knowledge of the theory: definitions, features, lists, components of frameworks, stages, roles, differences between one concept and another, formulas.
- **No application cases.** No tasks like "sort the examples", "identify the stage from the event", "what is closer to X in this situation".
- Examples and cases may appear in the explanation as an illustration, but not in the question itself and not in the answer options.
- **No calculations.** Nothing needs to be computed. Formulas are tested only for knowledge: match a quantity to its formula, fill in a missing part, choose the correct formula, "recall the formula".
- **Exception**: only if the user explicitly asked for cases or problems on a specific topic. Even then, no arithmetic: what gets multiplied by what, which filter narrows what, in what order the steps go.

## 2. What must not be there

- **Dumb questions:**
  - the answer is obvious without knowing the topic: wrong options are absurd, or the correct option is noticeably longer or more detailed than the others;
  - "true/false" with an absolute word ("always", "only", "necessarily", "never"): the answer "false" is guessed from the word. An absolute word is allowed only if it is the very point being tested;
  - the question tests wording or guessing, not knowledge;
  - random numbers and trivia unrelated to the substance (duration, "what percentage in the example");
  - vague "true/false" statements that can be read two ways;
  - duplicates: the same question in the same format with the same answer;
  - template phrasings like "Advantage of X: item." — it's unclear what is being asked. The question reads as a normal sentence: "'Item' is one of the advantages of X".
- **Questions about the course, textbook or lecture itself:** who it is aimed at, "the lesson says…", duration, what the author recommends doing.
- **Questions about characters of stories and examples** from the material and their cases. Names of such characters can be written to `.study-quiz/heroes.txt` (one per line), and `dumb_check.js` will catch them.
- Trivially simple questions that anyone could answer without studying.
- Phrasings like "in the course…", "in the lesson…", "in the lecture…", even in explanations.
- Long retellings of entire paragraphs. Definitions are taken from the material verbatim; everything else in explanations and hints is written in your own words.

## 2a. Terms in the words of the material

- Names of concepts, stages, blocks, roles and metrics are taken **exactly as they are named in the material**.
- Key words inside short definitions and formulas also come from the material. Then "match", "fill in the word" and "recall" use the same wording as the theory.
- In "fill in the word" the correct answer is the term from the material, plus spelling variants.

## 3. Coverage

- **Every** term, definition, feature, list, framework part and formula from the material appears in at least one question.
- Important concepts are asked **3–5 times in different formats**: concept → definition; gap in the definition; "list the features / components"; "how does X differ from Y"; "true / false"; "recall".
- Split a lesson into **microtopics**, 2–4 per lesson. Each microtopic has at least 3 questions of different types and at least 2 difficulty levels.
- Every concept that other questions rely on has, in its microtopic, a **basic "what is it" question** of type "match" or "choose the answer". It is shown first.
- After writing, run the `terms.py` check: bolded terms and definitions of the form "X is…" must be found in the questions. Everything the check flags as missing is reviewed manually.

## 4. Task types and order

| Level | Types | What they test |
|---|---|---|
| 1 · Warm-up | match (`match`), choose the answer (`mcq`), true/false (`truefalse`) | recognition |
| 2 · Practice | sort into groups (`sort`), table with gaps (`table`), diagram (`frame`), order (`order`) | structure |
| 3 · Recall | fill in the word (`cloze`), list (`list`), recall in your own words (`recall`) | reproduction without prompts |

- **A test runs in three phases:** simple first, then structure, free answer at the end. The trainer builds the order itself; you need to supply the right types.
- **Before every free-answer question** the same microtopic must contain **at least 2 simple** questions on the same concept. First you recognize, then you recall on your own.
- "Sort into groups" only by theoretical features, not by examples.
- "Order" only where the theory has a real sequence.
- "Table" (`table`) and "diagram" (`frame`) are for comparisons and frameworks from the material: an empty comparison table, a funnel, steps, nested circles, a grid (canvas), a formula tree.
- "Match" has 3–5 pairs: with two pairs the second one is guessed automatically.
- In one "match" all pairs are of the same kind: on the left only terms (or only roles), on the right only their definitions. Each right item fits exactly one left item. If there are fewer than three same-kind pairs, better use "choose the option" or "sort into groups".
- In "choose the answer" the wrong options are plausible and about the same length as the correct one. Vary the position of the correct answer.
- **"List": the number in the question = the number of items in the reference answer.** A fixed structure (stages, framework blocks) is named in full: `need` = all items, "Name the 5 parts of … in order". An open list may be partial, but then say so: "Name at least 4 advantages of … (there are 5 in total)". Never "Name 4" when the reference has 5.
- **The reference answer follows the order of the material.** Items in `answers`, steps in "order" and slots in a diagram go in the order they are listed in the source.
- "List" and "recall" are checked by self-assessment: you write the items, look at the reference and mark «Помню» ("I remember") or «Не помню» ("I don't remember"). Key roots (`keys`) are filled in anyway.
- In "fill in the word" the answer is one word or a short term, with spelling variants.

## 5. Explanations

- **Every** question except "recall" has a **detailed** explanation, usually 3–5 sentences: the full definition from the material, why the answer is what it is, why the other options don't fit, the link to neighboring concepts.
- **The explanation uses the material's words, no inventions.** If the source has 4 steps, the explanation has 4 steps in the same words.
- "Recall" has a full but compact reference answer (`back`).
- Where a comparison helps, add a small table to the explanation (`explainTable`).

## 6. Hints

- **Every** question except "recall" has a hint.
- A hint **points the way but does not give away the answer**: "remember what each approach starts with…", "one reason is internal, one is external".
- A hint may contain a diagram or table if the answer can't be read from it.

## 7. Images

- Take only **informative** images: diagrams, tables, charts, graphs, frameworks, formulas. Don't take decorative illustrations or pictures for stories.
- A diagram that explains a concept and **does not reveal the answer** goes directly into the question (`img`) or into the hint.
- A diagram from which the answer can be read directly goes **only into the explanation** (`explainImg`).
- **An image in a question is only about that question.** Don't attach the general diagram of the whole topic to a specific list: it confuses.
- Labelled diagrams: mask the labels with numbers and ask to match numbers to names; the full diagram goes into the explanation (`scripts/crop_image.py crop --mask`, SKILL.md §2).
- Copy images to `trainer/img/` with the topic prefix and shrink to 1400 px (macOS: `sips -Z 1400 in.png --out trainer/img/x-name.png`; otherwise `magick in.png -resize 1400x1400\> out.png`).

## 8. Technical

- Each large topic (section, module, chapter) is a separate file `trainer/quiz-data-<topic>.js`. Format: [docs/FORMAT.md](docs/FORMAT.md).
- All ids in a topic have their own prefix so they don't collide with other topics.
- Lesson names (`title`) are short, 1–3 words: they are shown on small cards. The full name goes in `lesson`, and it matches the notes file name `notes/<lesson>.md`.
- Before handing in, run `validate.js`: every question has a lesson and a microtopic, every non-"recall" has an explanation and a hint, all images exist, table rows have equal length.

## 9. Sources

- Closed platforms (paid courses, personal accounts) are **not scraped automatically** and nothing is downloaded from them: user agreements usually forbid it, and the user may get banned. The user saves pages themselves: open the lesson, wait for it to load, scroll to the end, "Save As → Web Page, Complete".
- After saving, check that the file contains the right lesson, the text goes all the way to the end, and the images were downloaded (`extract_html.py`).
- If the material contains an error or contradiction, use the correct version in the questions and mention it in the report.

## 10. Concepts, links and cheat sheets (`trainer/study-<topic>.js`)

Besides questions, each topic has a study materials file. From it the trainer itself builds cheat sheets, the course map and flashcards. Format: [docs/FORMAT.md](docs/FORMAT.md#cheat-sheets-concepts-and-links).

**Concepts**
- Concept id: `<lesson id>.<latin-word>`, for example `x-mem.curve`.
- `term`: the name exactly as in the material (§2a). `def`: the definition **verbatim from the material**. If it is very long, take the main sentence, but in the source's words, not a retelling.
- 4–10 concepts per lesson: everything worth learning as a "term ↔ definition" card. Don't make each list item a separate concept: the list goes into the cheat sheet as a `list` block.
- `sub`: an existing microtopic from quiz-data that the concept belongs to.
- No story characters, cases, "in the course / in the lesson".

**Links**
- Each lesson has at least one link to a concept of **another lesson**, otherwise the map falls apart into islands. 2–4 is good.
- `label`: a short verb or phrase of 1–3 words: "part of", "consists of", "follows", "relies on", "compared with", "opposite of". Reads as "from — label → to": check that the direction is right.
- Only meaningful links from the theory. No "mentioned nearby".
- When a new lesson is added, check the old ones: which concepts now have a link to the new one.

**Cheat sheets**
- The goal is to reread a lesson in 2 minutes before a test. It fits on one laptop screen or an A4 sheet: usually 3–5 blocks.
- `gist`: 1–2 sentences on what the lesson is about and why it's worth knowing.
- The first block is "Key concepts" (references to concepts). Then lists, stages (`ordered: true`), formulas, one comparison table if the material has a comparison.
- No more than one image, informative only (§7).
- List items are short, in the material's words. Everything in the cheat sheet must be in the source. Nothing of your own.

## 11. User feedback

Every piece of user feedback ("this question is dumb", "the hint gives away the answer") is a rule for the future. Add it to the project rules and apply it to **all** topics, not just the one it was about. First collect all the feedback, then do a single pass.
