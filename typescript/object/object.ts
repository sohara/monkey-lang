type ObjectType = string;

export const INTEGER_OBJ = "INTEGER";
export const STRING_OBJ = "STRING";
export const BOOLEAN_OBJ = "BOOLEAN";
export const NULL_OBJ = "NULL";
export const RETURN_VALUE_OBJ = "RETURN_VALUE";
export const ERROR_OBJ = "ERROR";

export interface Obj {
  type: ObjectType;
  inspect: string;
}

export class Integer implements Obj {
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
}

export class StringObj implements Obj {
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
}

export class BooleanObj implements Obj {
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

export class Environment {
  store: Map<string, Obj> = new Map();

  get(name: string): Obj | null {
    const obj = this.store.get(name);
    return obj ?? null;
  }

  set(name: string, value: Obj): Obj {
    this.store.set(name, value);
    return value;
  }
}
