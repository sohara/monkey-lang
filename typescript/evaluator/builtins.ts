import type { ObjectBindingOrAssignmentElement } from "typescript";
import { Builtin, Integer, StringObj, type Obj } from "../object/object";
import { newError } from "./evaluator";

const len = new Builtin(function (...args: Obj[]): Obj {
  if (args.length !== 1) {
    return newError(`wrong number of arguments. got=${args.length}, want=1`);
  }
  if (args[0].constructor.name === "StringObj") {
    return new Integer((args[0] as StringObj).value.length);
  } else {
    return newError(`argument to 'len' not supported, got ${args[0].type}`);
  }
});

export const builtins = new Map<string, Builtin>([["len", len]]);
