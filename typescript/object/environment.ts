import type { Obj } from "./object";

export class Environment {
  store: Map<string, Obj> = new Map();
  outer?: Environment;

  get(name: string): Obj | undefined {
    let obj = this.store.get(name);
    if (!obj && this.outer) {
      obj = this.outer.get(name);
    }
    return obj;
  }

  set(name: string, value: Obj): Obj {
    this.store.set(name, value);
    return value;
  }

  newEnclosedEnvironment() {
    const env = new Environment();
    env.outer = this;
    return env;
  }
}
