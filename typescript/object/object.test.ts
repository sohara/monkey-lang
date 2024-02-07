import { expect, test } from "bun:test";
import { BooleanObj, Integer, StringObj } from "./object";

test("string hash key", () => {
  const hello1 = new StringObj("Hello World");
  const hello2 = new StringObj("Hello World");
  const diff1 = new StringObj("My name is Johnny");
  const diff2 = new StringObj("My name is Johnny");

  expect(hello1.hashKey).toEqual(hello2.hashKey);
  expect(diff1.hashKey).toEqual(diff2.hashKey);
  expect(hello1.hashKey).not.toEqual(diff1.hashKey);
});

test("boolean hash key", () => {
  const true1 = new BooleanObj(true);
  const true2 = new BooleanObj(true);
  const false1 = new BooleanObj(false);
  const false2 = new BooleanObj(false);

  expect(true1.hashKey).toEqual(true2.hashKey);
  expect(false1.hashKey).toEqual(false2.hashKey);
  expect(true1.hashKey).not.toEqual(false1.hashKey);
});

test("integer hash key", () => {
  const one1 = new Integer(1);
  const one2 = new Integer(1);
  const two1 = new Integer(2);
  const two2 = new Integer(2);

  expect(one1.hashKey).toEqual(one2.hashKey);
  expect(two1.hashKey).toEqual(two2.hashKey);
  expect(one1.hashKey).not.toEqual(two1.hashKey);
});
