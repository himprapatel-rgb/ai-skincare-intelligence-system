#!/usr/bin/env node
/**
 * Picks the "Improvement of the Day" based on date.
 * Outputs JSON: { "title": "...", "body": "..." }
 */
const fs = require("fs");
const path = require("path");

const itemsPath = path.join(__dirname, "items.json");
const items = JSON.parse(fs.readFileSync(itemsPath, "utf8"));

const start = new Date("2026-01-01");
const today = new Date();
const dayNum = Math.floor((today - start) / (24 * 60 * 60 * 1000));
const index = dayNum % items.length;
const item = items[index];

const output = {
  title: `Improvement: ${item}`,
  body: `## Improvement of the Day

**Task:** ${item}

**Source:** [IMPROVEMENT-BACKLOG.md](../../docs/12-tasks/IMPROVEMENT-BACKLOG.md)

Implement this improvement. Update the backlog to check the item when done.`,
};

console.log(JSON.stringify(output));
