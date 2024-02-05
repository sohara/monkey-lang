import {
  Builtin,
  Integer,
  StringObj,
  type Obj,
  ArrayObj,
} from "../object/object";
import { NULL, newError } from "./evaluator";

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

const first = new Builtin(function (...args: Obj[]): Obj {
  if (args.length !== 1) {
    return newError(`wrong number of arguments. got=${args.length}, want=1`);
  }
  if (args[0].constructor.name !== "ArrayObj") {
    return newError(`argument to 'first' must be ARRAY, got ${args[0].type}`);
  }
  const arr = args[0] as ArrayObj;
  if (arr.elements.length > 0) {
    return arr.elements[0];
  }
  return NULL;
});

const last = new Builtin(function (...args: Obj[]): Obj {
  if (args.length !== 1) {
    return newError(`wrong number of arguments. got=${args.length}, want=1`);
  }
  if (args[0].constructor.name !== "ArrayObj") {
    return newError(`argument to 'last' must be ARRAY, got ${args[0].type}`);
  }
  const arr = args[0] as ArrayObj;
  const length = arr.elements.length;
  if (length > 0) {
    return arr.elements[length - 1];
  }
  return NULL;
});

const rest = new Builtin(function (...args: Obj[]): Obj {
  if (args.length !== 1) {
    return newError(`wrong number of arguments. got=${args.length}, want=1`);
  }
  if (args[0].constructor.name !== "ArrayObj") {
    return newError(`argument to 'last' must be ARRAY, got ${args[0].type}`);
  }
  const arr = args[0] as ArrayObj;
  const length = arr.elements.length;
  if (length > 0) {
    const [_, ...rest] = arr.elements;
    return new ArrayObj(rest);
  }
  return NULL;
});

const push = new Builtin(function (...args: Obj[]): Obj {
  if (args.length !== 2) {
    return newError(`wrong number of arguments. got=${args.length}, want=2`);
  }
  if (args[0].constructor.name !== "ArrayObj") {
    return newError(`argument to 'push' must be ARRAY, got ${args[0].type}`);
  }
  const arr = args[0] as ArrayObj;
  return new ArrayObj([...arr.elements, args[1]]);
});

export const builtins = new Map<string, Builtin>([
  ["len", len],
  ["first", first],
  ["last", last],
  ["rest", rest],
  ["push", push],
]);
