// Concepts, links and cheat sheets for the topic «Example: how memory works». Format: docs/FORMAT.md, section «Cheat sheets».
// This is a sample — delete it together with quiz-data-example.js once you add your own topic.
(window.STUDY_PARTS = window.STUDY_PARTS || []).push({
  group: "g-example",
  concepts: [
    { id: "x-mem.encoding", topic: "x-mem", sub: "x-mem-proc", term: "Encoding", def: "The conversion of information into a form in which it can be stored." },
    { id: "x-mem.storage", topic: "x-mem", sub: "x-mem-proc", term: "Storage", def: "The retention of encoded information over time." },
    { id: "x-mem.retrieval", topic: "x-mem", sub: "x-mem-proc", term: "Retrieval", def: "Access to stored information when it is needed." },
    { id: "x-mem.sensory", topic: "x-mem", sub: "x-mem-stores", term: "Sensory memory", def: "A store that holds impressions from the senses for a fraction of a second while the brain decides what to pay attention to." },
    { id: "x-mem.short", topic: "x-mem", sub: "x-mem-stores", term: "Short-term memory", def: "A store that holds a small amount of information (about 4–7 items) for a few seconds while it is being worked with." },
    { id: "x-mem.long", topic: "x-mem", sub: "x-mem-stores", term: "Long-term memory", def: "A store that holds information indefinitely and with almost no limit on capacity." },
    { id: "x-mem.curve", topic: "x-mem", sub: "x-mem-curve", term: "Forgetting curve", def: "A graph that shows how the share of retained information falls over time without review." },
    { id: "x-tech.recall", topic: "x-tech", sub: "x-tech-recall", term: "Active recall", def: "An attempt to retrieve information from memory without a prompt before looking at the answer." },
    { id: "x-tech.testing", topic: "x-tech", sub: "x-tech-recall", term: "Testing effect", def: "A phenomenon in which testing yourself leads to better memory than rereading the same material." },
    { id: "x-tech.illusion", topic: "x-tech", sub: "x-tech-recall", term: "Illusion of knowing", def: "The feeling that material has been learned because it seems familiar when reread." },
    { id: "x-tech.spaced", topic: "x-tech", sub: "x-tech-space", term: "Spaced repetition", def: "Reviewing material at intervals that grow after each successful recall." },
    { id: "x-tech.leitner", topic: "x-tech", sub: "x-tech-space", term: "Leitner system", def: "A method of spaced repetition using flashcards sorted into boxes." },
    { id: "x-tech.interleaving", topic: "x-tech", sub: "x-tech-mix", term: "Interleaving", def: "Mixing different topics or types of problems within one study session instead of working through them in blocks." }
  ],
  links: [
    { from: "x-mem.storage", to: "x-mem.encoding", label: "follows" },
    { from: "x-mem.retrieval", to: "x-mem.storage", label: "follows" },
    { from: "x-mem.sensory", to: "x-mem.short", label: "passes to" },
    { from: "x-mem.short", to: "x-mem.long", label: "passes to" },
    { from: "x-tech.leitner", to: "x-tech.spaced", label: "method of" },
    { from: "x-tech.recall", to: "x-tech.testing", label: "uses" },
    { from: "x-tech.illusion", to: "x-tech.recall", label: "exposed by" },
    // links between lessons, so the map does not fall apart into islands
    { from: "x-tech.spaced", to: "x-mem.curve", label: "relies on" },
    { from: "x-tech.recall", to: "x-mem.retrieval", label: "trains" }
  ],
  cheats: {
    "x-mem": {
      gist: "Memory works through three processes and three stores; without review, what you learned is quickly forgotten.",
      blocks: [
        { title: "Key concepts", concepts: ["x-mem.encoding", "x-mem.storage", "x-mem.retrieval", "x-mem.curve"] },
        { title: "The Atkinson–Shiffrin model", list: ["Sensory memory — a fraction of a second", "Short-term memory — a few seconds, about 4–7 items", "Long-term memory — indefinitely"], ordered: true },
        { title: "The forgetting curve", list: ["Forgetting is strongest in the first hours and days", "After that, forgetting slows down", "Each review makes the curve flatter"] }
      ] },
    "x-tech": {
      gist: "You remember best what you recall on your own, review at growing intervals and mix with other topics.",
      blocks: [
        { title: "Key concepts", concepts: ["x-tech.recall", "x-tech.testing", "x-tech.illusion", "x-tech.spaced", "x-tech.interleaving"] },
        { title: "The Leitner system", list: ["New cards — into the first box", "Correct answer — to the next box", "Wrong answer — back to the first box", "The further the box, the less often it is reviewed"], ordered: true },
        { title: "Blocked or interleaved", table: { head: ["", "Blocked", "Interleaving"], rows: [["Task order", "First all of one kind, then another", "Different kinds mixed together"], ["How studying feels", "Easy", "Harder"], ["A week later", "Remembered worse", "Remembered better"]] } }
      ] }
  }
});
