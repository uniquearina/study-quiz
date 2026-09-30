---
name: study-quiz
description: Turns any study material into a local memorization trainer — quizzes in 10 formats, cheat sheets per lesson, flashcards, a concept map and a daily spaced-repetition session. One HTML page that opens by double-click, no server. Material can be handwritten notes (photos, scans), PDF, docx/pptx, saved web pages, open links, pasted text or screenshots. Also keeps an existing trainer in sync when lessons are added, changed or removed, and runs an oral self-check. Use when the user wants tests, quizzes, flashcards, cheat sheets or a self-check trainer from lectures, notes, a textbook or a course, or brings new lessons for an existing trainer. Triggers: «сделай тесты / вопросы / карточки / шпаргалки по конспекту», «тренажёр для самопроверки», «вот новые уроки», «добавь тему в тренажёр», «обнови тренажёр», «проверь меня по теме», "make a quiz / flashcards from my notes", "add these lessons to my trainer", "update the trainer", "quiz me on this topic".
---

# study-quiz — a memorization trainer from any material

You turn study material into a trainer: questions, cheat sheets, flashcards and a concept map. **The goal is to memorize the theory, not to test the person.** This is the core idea; every rule follows from it.

Skill files (paths relative to the folder containing this SKILL.md; usually `~/.claude/skills/study-quiz/`):
- `RULES.md` — rules for writing questions, concepts and cheat sheets. **Read it in full before starting** and follow all of it.
- `docs/FORMAT.md` — file format: all 10 question types, concepts, links, cheat sheets, the part file for inserting a lesson.
- `assets/trainer/` — trainer template; interface in English or Russian (`lang` in `config.js`).
- `examples/en/`, `examples/ru/` — the same sample topic "How memory works" in both languages: notes plus `quiz-data-example.js` and `study-example.js`.
- `assets/cloud/`, `docs/CLOUD.md` — optional cloud copy for the phone with shared progress.
- `scripts/` — tools. All are run **from the project folder** (the one containing `trainer/`):

| script | what it does |
|---|---|
| `extract_html.py` | text of saved HTML pages → `notes/*.md`, checks that the page was saved completely |
| `sync.py [--lock]` | what changed in `notes/` compared to the trainer: NEW / CHANGED / REMOVED |
| `add_topic.js part.js [--replace] [--dry]` | insert a new lesson or replace a rewritten one |
| `remove_topic.js <lesson id> [--dry]` | remove a lesson everywhere (everything removed goes to `archive/removed/`) |
| `patch_questions.js patch.json` | fix question fields by id: `{ "id": { "field": value \| null } }` |
| `delete_questions.js "reason" id…` | delete individual questions |
| `validate.js` | structure of questions, concepts, links, cheat sheets |
| `dumb_check.js --list` | signs of dumb questions |
| `terms.py` | whether all terms from the notes made it into questions |
| `e2e.py`, `e2e_study.py` | automated tests in headless Chrome |
| `screens.py` | screenshots of screens for visual review |
| `deploy.sh` | deploy the cloud copy (if configured) |

Below, `S` is the skill's `scripts/` folder, e.g. `S=~/.claude/skills/study-quiz/scripts`.

Talk to the user in their language. Write notes, questions, concepts and cheat sheets in the language of the material.

## 1. Identify the project

- **The folder already has `trainer/index.html`** — this is an existing trainer: add to it. If the folder has a `CLAUDE.md` or its own rules (e.g. `RULES.md`), read them: the user's rules take precedence over the skill's rules.
- **No trainer** — create a project:
  1. `cp -r <skill>/assets/trainer ./trainer`, then copy the sample in the language of the material: `cp <skill>/examples/<en|ru>/*.js ./trainer/` (for another language take `en`).
  2. In `trainer/config.js` set `lang` (`"en"` or `"ru"` — the language of the material; the interface supports only these two, for any other take `"en"`), `title` (name in the header), `subtitle` (large heading, usually the course name) and a **unique** `key`, e.g. `trainer-biology-2026`. All pages opened via `file://` share one browser storage: without a unique key, progress of different trainers gets mixed.
  3. Create folders `sources/` (source files as is) and `notes/` (clean text per lesson).
  4. Keep the sample (`quiz-data-example.js`, `study-example.js`) as a format reference while writing the first topic, then delete the files and their `<script>` lines from `index.html`.
  5. Suggest the user create a `CLAUDE.md` in the project folder: briefly what the course is and which id prefixes are taken — this speeds up future sessions.

## 2. Material → text in `notes/<lesson>.md`

Each lesson needs a file with its full text. File name = full lesson title (also the `lesson` field in the trainer; ":" and "/" in the name are replaced with "_"). Mark terms in `**bold**`, mark diagrams with a line `[IMG path]`.

| What was sent | How to read it |
|---|---|
| Photo / scan of handwriting, screenshots | Read the image, transcribe the text. Mark illegible parts `[?]` and ask the user. Describe diagrams and tables in text; save legible ones as images. |
| PDF | Read with `pages` (no more than 20 pages per call) or the `pdf` skill. Crop out the needed diagrams. |
| docx / pptx | The `docx` / `pptx` skills or `textutil -convert txt` (macOS), `pandoc`. |
| Saved HTML pages | `python3 $S/extract_html.py sources/ "Lesson 1" "Lesson 2" …` (the list comes from the course table of contents). Show a "lesson → what's wrong" table and ask to re-save only the broken ones. |
| Link to an open page (article, documentation) | WebFetch. |
| Link to a paid course / closed platform | **Do not log in or scrape it yourself.** Terms of such platforms usually forbid automated collection; the user can get banned. Ask the user to save the pages manually: open the lesson, wait for it to load, scroll to the end, "Save As → Web Page, Complete" (in a Russian browser: «Сохранить как → Веб-страница, полностью») into `sources/`. Or to send the text. |
| Plain text in chat | Save as is. |

**Handwritten notes across many photos:**
- Page order: by file name; if there are no numbers — by capture time (`mdls -name kMDItemContentCreationDate` / EXIF). If unsure of the order, check whether the sentence continues from the previous page.
- Photos of one lecture → one `notes/<lesson>.md`: join into continuous text; a word or phrase split across a page boundary is one whole. Which lecture a photo belongs to is shown by the subfolder, date or heading on the sheet; if it isn't clear — split by meaning (see "Material not split into lessons" below).
- Do not guess terms and definitions: questions will be built from them verbatim. Illegible → `[?]` with a candidate reading. After transcribing all photos, ask your questions **in one list** ("photo 3, the line about …: 'retroactive' or 'reproductive'?"), not one at a time.
- List blurry, cropped, overexposed photos and ask to reshoot only those. Read upside-down and sideways photos as they are.
- Arrows, boxes, diagrams in the margins are structure: carry them over as a list, table or `[IMG]` if the diagram can't be retold in text.
- Many photos (more than ~30) — hand transcription out to helpers by lecture, collect `[?]` into one shared list.

If a **list of lessons** was sent (a screenshot of the table of contents), check against it that everything is present and say what's missing.

**Material not split into lessons** (one big PDF, continuous notes, a book without chapters, mixed files) — split it yourself before writing `notes/`:
1. Read everything and find natural boundaries: headings, table of contents, change of subject, lecture dates.
2. A lesson = one coherent idea of roughly 10–20 questions (4–10 concepts). Cut pieces that are too long, glue small fragments on one subject together. Group lessons into topics (`group`) of 3–9 lessons.
3. Show the user the plan as one table "topic → lesson → source (pages / files) → what it's about"; make up clear lesson titles. Wait for confirmation or edits, then distribute the text into `notes/`.
4. Record where each lesson came from (`<!-- source: file.pdf, pp. 12–18 -->` as the first line of `notes/<lesson>.md`), so that when the source changes you can find what to update.

**Material arrives in parts** (first a few lectures, then one at a time): put new material into existing topics if it fits by meaning, otherwise create a new topic. Do not re-split or rename lessons already in the trainer: progress is tied to their ids. If a new lecture continues a previous one, it is a separate lesson, and add a reference to it in the previous lesson's cheat sheet and links (step 4.7). In the plan, mark what's new and what already exists.

## 3. What changed (for an existing trainer)

```bash
python3 $S/sync.py
```
- 🆕 **NEW** — notes exist, lesson doesn't → step 4.
- ✏️ **CHANGED** — the notes text changed since the last build → look at the `diff` (the script prints the command). Minor edits — targeted via `patch_questions.js`. Substantial ones — rebuild the part: keep questions on unchanged theory **with the same ids** (this preserves progress), add new ones, remove outdated ones, insert via `add_topic.js --replace`.
- 🗑 **REMOVED** — lesson exists, notes don't → `node $S/remove_topic.js <id> --dry`, then without `--dry`. After removal, check the cheat sheets and links of neighboring lessons. If more than half of a topic's lessons disappeared — first ask the user whether the files were deleted by accident.
- **Renaming:** REMOVED and NEW with nearly identical titles — most likely the same lesson. Compare the texts; if it is the same, handle it as CHANGED with the same lesson id and the new `lesson`.

## 4. Build the lesson

1. Read the lesson **in full**, including diagrams: they often contain theory that isn't in the text.
2. **First write out the skeleton:** concepts (definitions verbatim), lists with all items, classifications, stages, formulas, comparisons. Split into microtopics, 2–4 per lesson.
3. From the skeleton, build the **part file** (format — `docs/FORMAT.md`, section "Part file"): lesson, microtopics, questions, concepts, links, cheat sheet, links to other topics. The essentials in brief (in detail — `RULES.md`):
   - ~10–20 questions per lesson, 3–5 per microtopic; pack definitions into "match" with 3–5 pairs, lists into "select all" + "list";
   - definitions and terms — **in the material's words**;
   - **no cases or calculations**, no questions about the course or characters in examples, no dumb questions;
   - a detailed explanation and a nudging hint for all types except "recall";
   - in every microtopic with free-form answers — at least 2 simple questions on the same concepts;
   - comparisons and diagrams from the material — as `table` and `frame` types;
   - 4–10 concepts per lesson, a cheat sheet of 3–5 blocks, at least one link to a concept of another lesson.
4. The lesson continues a topic already in the trainer (common when a course arrives one lecture a week) — same `group.id` and prefix; continue id numbers from the last one taken. New topic — new `group` (`id: "g-<slug>"`), a `slug` for files and a **new id prefix** (one or two Latin letters not taken in `trainer/quiz-data*.js`).
5. Images: `sips -Z 1400 "<source>" --out "trainer/img/<prefix>-<name>.png"` (not macOS — `magick … -resize 1400x1400\>`).
6. Insert: `node $S/add_topic.js part.js --dry`, then without `--dry`.
7. Check whether old lessons now have links to the new concepts — add them to `trainer/study-links.js`.

**Large volume.** If there are more than 6–8 lessons, hand the work to helpers (Agent): **one helper per topic, 4–9 lessons, no nested helpers**. A simpler model is fine for generation; check the quality yourself. Give each one: the path to `RULES.md` and `docs/FORMAT.md` (to read in full), its lessons in `notes/` and images, the sample `examples/<lang>/quiz-data-example.js`, its id prefix and the path for the part file. The helper checks itself that its part loads: `node -e 'require("./part.js")'`.

## 5. Check (all mandatory)

```bash
node $S/validate.js            # 0 errors; fix microtopic warnings too
node $S/dumb_check.js --list   # long correct option, mentions of the course and characters, calculations, duplicates
python3 $S/terms.py            # missed terms (some are false positives — check by eye)
python3 $S/e2e.py              # marathon through all questions: order, no hangs
python3 $S/e2e_study.py        # «На сегодня» (Today), cheat sheets, flashcards, map
python3 $S/screens.py          # screenshots in /tmp/study-quiz-screens — look at the new cheat sheet by eye
```

Then go through the new questions yourself: no cases, calculations, questions about the course; hints and images don't give the answer away; the correct option isn't longer than the others.

Browser tests need Chrome (Google Chrome, Chromium or Playwright). The path can be set with the `CHROME` variable.

When everything is clean: `python3 $S/sync.py --lock` — save the state so that CHANGED shows up next time. If the cloud is configured — `bash $S/deploy.sh`.

## 6. Report briefly

- how many lessons, questions, concepts and cheat sheets were added, changed, removed;
- which images were taken;
- what's missing in the sources and what to re-save;
- errors and contradictions found in the material and which version was used;
- how to open: double-click `trainer/index.html`.

## Oral exam

The user writes "quiz me on <topic>" (may attach a progress export — the «Сохранить прогресс в файл» (Save progress to file) button).
1. If there's an export — pick weak spots: questions and cards with `last: 0`, cards with `box ≤ 2`, microtopics with mistakes. If not — take the topic's concepts at random, with emphasis on key ones.
2. Ask 8–10 "explain in your own words" questions **one at a time**: what X is, how X differs from Y, what it consists of, how they are related (based on `concepts` and `links`). Theory only, no cases or calculations.
3. For each answer — briefly: what's right, what's missed, the reference answer from `def`. Don't praise empty answers.
4. At the end — a summary: what they know, what to review. Write it to `exams/<date>-<topic>.md`.
5. Create `exams/<date>-import.json`: `{ "merge": true, "reset": { "q": [question ids], "cards": [concept ids] } }` and tell the user to load it with the «Загрузить из файла» (Load from file) button — what was missed will return to «На сегодня».

## How the trainer works

If asked to change the interface: logic and screens for the home page, «Свой тест» (Custom test), the test and results — `trainer/index.html`; cheat sheets, flashcards and the map — `trainer/study.js`; spaced repetition — `trainer/srs.js`.

- **Home:** «На сегодня» (one button) → «Уроки» (Lessons; a lesson opens with its cheat sheet: lesson test, flashcards, mistakes, microtopics) and «Карта курса» (Course map) → «Свой тест» (any lessons, all / new / mistakes, length 20 / 40 / 80 / all, history).
- **Test order** (`buildOrder`): three phases — simple → structure → free answer; "true/false" on a microtopic only after its definition; types don't repeat back to back.
- **Test composition** (`pickSubset`): mistakes → new → reviewed long ago, microtopics round-robin, hard ones only after a simple question on the same microtopic.
- **«На сегодня»** (`srs.js`): ladder 1 → 3 → 7 → 16 → 35 → 80 days; ~25 questions a day, half reviews and half new (new ones alternate from the start and the end of the course); flashcards at the end of the session.
- **Progress** — `localStorage` under the key `TRAINER.key` from `config.js`; export and import to a file on the home page.
- After interface edits: `e2e.py`, `e2e_study.py` and screenshots. The scripts disable the external font in test copies themselves.

## Saving tokens

- First collect all the user's requirements, then do **one pass**. Don't rewrite the whole bank after every remark.
- Question files quickly get large. Don't read them in full or rewrite them by hand: change them surgically with scripts by id.
- Read the material once: first into `notes/`, then work from `notes/`. Look at images only for the lessons you're working on now.
- Every user remark is a rule for the future: add it to the project rules and apply it to all topics (`RULES.md` §11).
