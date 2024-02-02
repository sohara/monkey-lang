import type {
  BooleanLiteral,
  ExpressionStatement,
  IntegerLiteral,
  Node,
  Program,
  Statement,
} from "../ast/ast";
import { BooleanObj, Integer, NullObj, type Obj } from "../object/object";

const TRUE = new BooleanObj(true);
const FALSE = new BooleanObj(false);
const NULL = new NullObj();

export function evaluate(node: Node): Obj | null {
  switch (node.constructor.name) {
    // Statements
    case "Program":
      return evalStatements((node as Program).statements);
    case "ExpressionStatement":
      return evaluate((node as ExpressionStatement).expression);

    // Expressions
    case "IntegerLiteral":
      return new Integer((node as IntegerLiteral).value);
    case "BooleanLiteral":
      return nativeBoolToBooleanObject((node as BooleanLiteral).value);
  }

  return null;
}

function evalStatements(statements: Statement[]): Obj | null {
  let result: Obj | null = null;
  for (const statement of statements) {
    result = evaluate(statement);
  }
  return result;
}

function nativeBoolToBooleanObject(input: boolean): BooleanObj {
  if (input) {
    return TRUE;
  } else {
    return FALSE;
  }
}
