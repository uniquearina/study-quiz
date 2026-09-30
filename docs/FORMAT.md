# Question file format

Sample strings are in English; real content is written in the language of the material.

One large topic (section, module, sprint) = one file `trainer/quiz-data-<topic>.js`. The file adds itself to the shared list:

```js
// Questions: topic «Topic name».
(window.QUIZ_PARTS = window.QUIZ_PARTS || []).push({
  group: { id: "g-bio", title: "The Cell" },                   // large topic
  topics: [                                                    // lessons of the topic, in order
    { id: "b-cell", title: "Cell Structure", lesson: "Cell Structure" }, // title: 1–3 words for the card,
    { id: "b-div",  title: "Division", lesson: "Mitosis and Meiosis" }    // lesson: full name (same as the notes file)
  ],
  subs: { "b-cell-org": "Organelles", "b-cell-mem": "Membrane" }, // micro-topics: 2–4 per lesson
  questions: [ /* … */ ]
});
```

Wiring: the line `<script src="quiz-data-<topic>.js"></script>` goes in `trainer/index.html` after the comment `<!-- QUIZ-DATA -->` (the `add_topic.js` script does this itself).

Each topic has its own **prefix** for all ids (`b-…` / `b12`) so topics do not collide.

## Common question fields

```js
{ id: "b12", topic: "b-cell", sub: "b-cell-org", type: "mcq",
  hint: { text: "a nudge without the answer", img: "b-scheme.png", table: { head: [...], rows: [[...]] } }, // on all types except recall
  img: "b-scheme.png",          // or ["a.png","b.png"]: shown in the question — only if it does NOT give away the answer
  explainImg: "b-scheme.png",   // shown in the explanation after answering
  explainTable: { head: ["Concept", "Essence"], rows: [["…", "…"]] },  // every row the same length as head
  q: "question text",
  explanation: "explanation, 3–5 sentences" }  // on all types except recall
```

The level is set by the type:
1. `match`, `mcq`, `truefalse` — simple;
2. `sort`, `table`, `frame`, `order`;
3. `cloze`, `list`, `recall` — free answer.

## Fields by type

```js
// mcq — pick the answer. Several indexes = pick several (then add to q: "Select all that apply." — in Russian material «Выбери все верные.»)
{ type: "mcq", q: "What is an organelle?", options: ["…", "…", "…", "…"], correct: [2] }

// truefalse — true / false
{ type: "truefalse", q: "Statement…", answer: false }

// match — connect pairs (2–5 pairs). The left side can be an image: [{ img: "b-x.png" }, "caption"]
{ type: "match", q: "Match the term to its definition", pairs: [["Term A", "Definition A"], ["Term B", "Definition B"]] }

// sort — sort into groups (theoretical features only, not examples)
{ type: "sort", q: "A feature of which?", groups: { "Mitosis": ["…", "…"], "Meiosis": ["…", "…"] } }

// order — put in order (items are listed in the correct order)
{ type: "order", q: "Put the phases in order", items: ["Prophase", "Metaphase", "Anaphase", "Telophase"] }

// table — table with blanks: blanks are "row-column" cells (column 0 holds row headers; never blank it)
{ type: "table", q: "Fill in the blanks in the comparison table", head: ["", "Mitosis", "Meiosis"],
  rows: [["Number of divisions", "One", "Two"], ["Daughter cells", "Two", "Four"]], blanks: ["0-2", "1-1"],
  extra: ["Three"] }                      // optional: extra decoy chips

// frame — an empty diagram from the material: the user places the labels in their slots. Layouts:
//   steps (steps left to right), funnel (funnel top to bottom), nested (nested circles from widest to narrowest),
//   grid (a grid, like a canvas: areas = CSS grid-template-areas, each slot has an area), tree (a tree: parent = index of the parent, op = operator sign)
{ type: "frame", layout: "steps", q: "Fill in the diagram…", slots: [{ label: "Step 1" }, { label: "Step 2", hint: "note under the slot" }, { label: "Step 3" }] }
{ type: "frame", layout: "grid", areas: ["a b c", "d d e"], slots: [{ area: "a", label: "…" }, { area: "b", label: "…" }, …] }
{ type: "frame", layout: "tree", slots: [{ label: "Revenue", parent: null }, { label: "Customers", parent: 0, op: "×" }, { label: "Average check", parent: 0, op: "×" }] }

// cloze — type in a word. q contains exactly one "___". The first answer is canonical, the rest are spelling variants
{ type: "cloze", q: "The power station of the cell is the ___.", answers: ["mitochondrion", "mitochondria"] }

// list — list items (checked by self-assessment). keys are word roots in lowercase
{ type: "list", q: "Name 3 …", need: 3,
  answers: [{ label: "Item 1", keys: ["root1", "synonym"] }, { label: "Item 2", keys: ["root2"] }, { label: "Item 3", keys: ["root3"] }] }

// recall — a "recall it yourself" flashcard. No hint and no explanation
{ type: "recall", q: "State the definition of X", back: "Reference answer, complete and compact" }
```

## Small things

- Quotes inside strings are «guillemets», not `"`.
- In `mcq`, vary the position of the correct answer and make sure the correct option is **not noticeably longer** than the others (the `dumb_check.js` script catches this).
- In `list`, put an item with a narrower root before an item whose root is contained in it as a substring (e.g. «постпродаж» "post-sales" before «продаж» "sales").
- Images live in `trainer/img/` with the topic prefix.

## Cheat sheets, concepts and links

Each topic needs a second file `trainer/study-<topic>.js` (loaded before `study-links.js`). From it the trainer builds lesson cheat sheets, flashcards and the course map. Content rules: `RULES.md` §10.

```js
(window.STUDY_PARTS = window.STUDY_PARTS || []).push({
  group: "g-bio",                        // topic id from quiz-data-<topic>.js
  concepts: [                            // concepts = flashcards = map nodes
    { id: "b-cell.mito", topic: "b-cell", sub: "b-cell-org",
      term: "Mitochondrion", def: "…definition verbatim from the material…",
      formula: "…",                      // optional
      img: "b-mito.png" }                // optional: a diagram from trainer/img
  ],
  links: [                               // arrows on the map: "from — label → to"
    { from: "b-cell.mito", to: "b-cell.atp", label: "produces" }
  ],
  cheats: {                              // a cheat sheet for every lesson, key = lesson id
    "b-cell": { gist: "The essence of the lesson in 1–2 sentences.",
      blocks: [
        { title: "Key concepts", concepts: ["b-cell.mito", "…"] },   // definitions are taken from concepts
        { title: "Stages", list: ["step 1", "step 2"], ordered: true },
        { title: "Formulas", formulas: [["Name", "formula"]] },
        { title: "Comparison", table: { head: ["", "A", "B"], rows: [["…", "…", "…"]] } },
        { img: "b-scheme.png", caption: "caption" }
      ] }
  }
});
```

Links between concepts of **different** topics go in `trainer/study-links.js`: `window.STUDY_LINKS = [ { from, to, label }, … ]`.

## Part file for `add_topic.js`

A new lesson is easiest to assemble in a single part file (CommonJS) and insert with the script: it checks for id collisions, puts the lesson in its place, creates the files for a new topic and wires them into `index.html`.

```js
module.exports = {
  group: { id: "g-bio", title: "The Cell" },
  slug: "bio",                           // only for a NEW topic: quiz-data-bio.js + study-bio.js
  topics: [{ id: "b-div", title: "Division", lesson: "Mitosis and Meiosis", after: "b-cell" }],  // after = id of the previous lesson
  subs: { "b-div-mit": "Mitosis" },
  questions: [ /* as above */ ],
  concepts: [ /* … */ ], links: [ /* within the topic */ ], cheats: { "b-div": { gist, blocks } },
  crossLinks: [ /* { from, to, label } with concepts of other topics → study-links.js */ ]
};
```

```bash
node <skill>/scripts/add_topic.js part.js --dry        # preview what will change
node <skill>/scripts/add_topic.js part.js              # insert a new lesson
node <skill>/scripts/add_topic.js part.js --replace    # replace a rewritten lesson (existing ids keep their progress)
```
