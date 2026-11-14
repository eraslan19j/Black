import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recognize } from '../src/recognizer.js';

test('tek vuruşlu rünler ve ters çizim yönü tanınır', () => {
  const v = [{ x: 10, y: 10 }, { x: 60, y: 100 }, { x: 110, y: 10 }];
  assert.equal(recognize(v).name, 'su'); assert.equal(recognize([...v].reverse()).name, 'su');
  assert.equal(recognize([{ x: 0, y: 100 }, { x: 50, y: 0 }, { x: 100, y: 100 }]).name, 'siper');
  const circle = Array.from({length: 65}, (_, i) => ({x: 100 + 80 * Math.sin(i*Math.PI*2/64), y: 100 - 80 * Math.cos(i*Math.PI*2/64)}));
  assert.equal(recognize(circle).name, 'kor');
});
test('kısa ve alakasız çizimler reddedilir', () => {
  assert.equal(recognize([{x: 1,y: 1}, {x: 2,y: 2}]), null);
  assert.equal(recognize([{x: 0,y: 0}, {x: 100,y: 0}]), null);
});
