import { test } from 'node:test';
import assert from 'node:assert/strict';
import { joystickVector, keyboardVector } from '../src/movement.js';
test('joystick merkezde durur, çapraz ve uzun sürüklemeyi sınırlar', () => {
  assert.deepEqual(joystickVector(1,1,50), {x:0,y:0});
  const diagonal = joystickVector(100,100,50); assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y)-1)<1e-9);
  assert.equal(joystickVector(0,50,50).y,1);
  assert.deepEqual(joystickVector(20,20,0), {x:0,y:0});
});
test('tuşlarda zıt yönler birbirini götürür, çapraz hız normalize edilir', () => {
  assert.deepEqual(keyboardVector(new Set(['left','right'])), {x:0,y:0});
  const diagonal = keyboardVector(new Set(['up','right'])); assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y)-1)<1e-9); assert.ok(diagonal.y<0);
});
