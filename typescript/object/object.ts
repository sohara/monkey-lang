import type { BlockStatement, Identifier } from "../ast/ast";
import type { Environment } from "./environment";

// type ObjectType = string;

export const INTEGER_OBJ = "INTEGER" as const;
export const STRING_OBJ = "STRING" as const;
export const BOOLEAN_OBJ = "BOOLEAN" as const;
export const NULL_OBJ = "NULL" as const;
export const RETURN_VALUE_OBJ = "RETURN_VALUE" as const;
export const ERROR_OBJ = "ERROR" as const;
export const FUNCTION_OBJ = "FUNCTION" as const;
export const BUILTIN_OBJ = "BUILTIN" as const;
export const ARRAY_OBJ = "ARRAY" as const;
export const HASH_OBJ = "HASH" as const;

const OBJECT_TYPES = [
  INTEGER_OBJ,
  STRING_OBJ,
  BOOLEAN_OBJ,
  NULL_OBJ,
  RETURN_VALUE_OBJ,
  ERROR_OBJ,
  FUNCTION_OBJ,
  BUILTIN_OBJ,
  ARRAY_OBJ,
  HASH_OBJ,
] as const;

type ObjectType = (typeof OBJECT_TYPES)[number];

export interface Obj {
  type: ObjectType;
  inspect: string;
}

export type HashKey = `${ObjectType}:${number}`;

export interface Hashable {
  hashKey: HashKey;
}

export class Integer implements Obj, Hashable {
  value: number;

  constructor(value: number) {
    this.value = value;
  }
  get inspect() {
    return `${this.value}`;
  }

  get type() {
    return INTEGER_OBJ;
  }

  get hashKey(): HashKey {
    return `${this.type}:${this.value + 2}`;
  }
}

export class StringObj implements Obj, Hashable {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  get inspect() {
    return `${this.value}`;
  }

  get type() {
    return STRING_OBJ;
  }

  get hashKey(): HashKey {
    let hash = 0;
    if (this.value.length === 0) {
      hash = 2; // Start from 2 if string is empty
    }
    for (let i = 0; i < this.value.length; i++) {
      const char = this.value.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    if (hash === 0 || hash === 1) {
      hash += 2; // Adjust hash if it's 0 or 1
    }
    return `${this.type}:${hash}`;
  }
}

export class BooleanObj implements Obj, Hashable {
  value: boolean;

  constructor(value: boolean) {
    this.value = value;
  }

  get inspect() {
    return `${this.value}`;
  }

  get type() {
    return BOOLEAN_OBJ;
  }

  get hashKey(): HashKey {
    let value: number;
    if (this.value) {
      value = 1;
    } else {
      value = 0;
    }
    return `${this.type}:${value}`;
  }
}

export class NullObj implements Obj {
  get inspect() {
    return `null`;
  }

  get type() {
    return NULL_OBJ;
  }
}

export class ReturnValue implements Obj {
  value: Obj;

  constructor(value: Obj) {
    this.value = value;
  }

  get inspect() {
    return this.value.inspect;
  }

  get type() {
    return RETURN_VALUE_OBJ;
  }
}

export class ErrorObj implements Obj {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  get type() {
    return ERROR_OBJ;
  }

  get inspect() {
    return `ERROR: ${this.message}`;
  }
}

export class FunctionObj implements Obj {
  parameters: Identifier[];
  body: BlockStatement;
  env: Environment;

  constructor(
    parameters: Identifier[],
    body: BlockStatement,
    env: Environment,
  ) {
    this.parameters = parameters;
    this.body = body;
    this.env = env;
  }

  get type() {
    return FUNCTION_OBJ;
  }

  get inspect() {
    return `fn(${this.parameters.map((p) => p.string).join(",")}) {\n${
      this.body.string
    }\n}`;
  }
}

type BuiltinFunction = (...args: Obj[]) => Obj;

export class Builtin implements Obj {
  fn: BuiltinFunction;

  constructor(fn: BuiltinFunction) {
    this.fn = fn;
  }
  get type() {
    return BUILTIN_OBJ;
  }

  get inspect() {
    return `builtin function`;
  }
}

export class ArrayObj implements Obj {
  elements: Obj[];

  constructor(elements: Obj[]) {
    this.elements = elements;
  }

  get type() {
    return ARRAY_OBJ;
  }

  get inspect() {
    return `[${this.elements.map((el) => el.inspect).join(", ")}]`;
  }
}

export class HashPair {
  key: Obj;
  val: Obj;

  constructor(key: Obj, val: Obj) {
    this.key = key;
    this.val = val;
  }
}

export class Hash implements Obj {
  pairs: Map<HashKey, HashPair> = new Map();

  get type() {
    return HASH_OBJ;
  }

  get inspect() {
    return `{${Array.from(this.pairs.values())
      .map((pair) => `${pair.key.inspect}: ${pair.val.inspect}`)
      .join(", ")}}`;
  }
}
