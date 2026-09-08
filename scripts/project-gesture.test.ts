import assert from "node:assert/strict";
import { test } from "node:test";
import { createProjectLinkGesture } from "../src/components/projectLinkGesture";

test("stationary taps and slight finger jitter open once", () => {
  const guard = createProjectLinkGesture();
  guard.start(0, 1, 100, 200, 1000);
  guard.end(1, 103, 202);
  assert.equal(guard.consume(0, 1), true);
  assert.equal(guard.consume(0, 1), false);
});

for (const [name, x, y] of [["vertical swipe", 100, 300], ["horizontal swipe", 200, 200]] as const) {
  test(`${name} cannot open a card, even after returning to its start`, () => {
    const guard = createProjectLinkGesture();
    guard.start(0, 1, 100, 200, 1000);
    guard.move(1, x, y);
    guard.end(1, 100, 200);
    assert.equal(guard.consume(0, 1), false);
  });
}

test("browser-canceled panning and clicks landing on another card are blocked", () => {
  const guard = createProjectLinkGesture();
  guard.start(0, 1, 100, 200, 1000);
  guard.cancel(1);
  guard.end(1, 100, 200);
  assert.equal(guard.consume(0, 1), false);
  guard.start(0, 2, 100, 200, 2000);
  guard.end(2, 100, 200);
  assert.equal(guard.consume(1, 1), false);
});

test("scroll during a press and taps stopping momentum do not navigate", () => {
  const guard = createProjectLinkGesture();
  guard.start(0, 1, 100, 200, 1000);
  guard.scroll(1050);
  guard.end(1, 100, 200);
  assert.equal(guard.consume(0, 1), false);
  guard.start(0, 2, 100, 200, 1100);
  guard.end(2, 100, 200);
  assert.equal(guard.consume(0, 1), false);
  guard.start(0, 3, 100, 200, 1500);
  guard.end(3, 100, 200);
  assert.equal(guard.consume(0, 1), true);
});

test("a gesture starting elsewhere cannot launch a project", () => {
  const guard = createProjectLinkGesture();
  guard.start(0, 1, 100, 200, 1000);
  guard.end(1, 100, 200);
  guard.reset();
  assert.equal(guard.consume(0, 1), false);
});

test("keyboard and assistive activation work even immediately after scrolling", () => {
  const guard = createProjectLinkGesture();
  guard.scroll(1000);
  assert.equal(guard.consume(0, 0), true);
});
