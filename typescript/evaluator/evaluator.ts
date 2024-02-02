import type {
  BooleanLiteral,
  ExpressionStatement,
  IntegerLiteral,
  Node,
  PrefixExpression,
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
    case "PrefixExpression":
      const right = evaluate((node as PrefixExpression).right);
      return evalPrefixExpression((node as PrefixExpression).operator, right);
  }

  return null;
}

function evalPrefixExpression(operator: string, right: Obj | null): Obj {
  switch (operator) {
    case "!":
      return evalBangOperatorExpression(right);
    default:
      return NULL;
  }
}

function evalBangOperatorExpression(right: Obj | null): Obj {
  switch (right) {
    case TRUE:
      return FALSE;
    case FALSE:
      return TRUE;
    case NULL:
      return TRUE;
    default:
      return FALSE;
  }
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
