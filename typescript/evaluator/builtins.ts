import {
  Builtin,
  Integer,
  StringObj,
  type Obj,
  ArrayObj,
} from "../object/object";
import { newError } from "./evaluator";

const len = new Builtin(function (...args: Obj[]): Obj {
  if (args.length !== 1) {
    return newError(`wrong number of arguments. got=${args.length}, want=1`);
  }
  switch (args[0].constructor.name) {
    case "StringObj":
      return new Integer((args[0] as StringObj).value.length);
    case "ArrayObj":
      return new Integer((args[0] as ArrayObj).elements.length);
    default:
      return newError(`argument to 'len' not supported, got ${args[0].type}`);
  }
});

export const builtins = new Map<string, Builtin>([["len", len]]);
