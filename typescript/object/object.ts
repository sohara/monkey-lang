type ObjectType = string;

const INTEGER_OBJ = "INTEGER";
const BOOLEAN_OBJ = "BOOLEAN";
const NULL_OBJ = "NULL";

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
