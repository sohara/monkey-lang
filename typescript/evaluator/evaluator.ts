import { which } from "bun";
import type {
  BlockStatement,
  BooleanLiteral,
  ExpressionStatement,
  IfExpression,
  InfixExpression,
  IntegerLiteral,
  Node,
  PrefixExpression,
  Program,
  Statement,
  ReturnStatement,
} from "../ast/ast";
import {
  BooleanObj,
  INTEGER_OBJ,
  Integer,
  NullObj,
  ReturnValue,
  type Obj,
  RETURN_VALUE_OBJ,
} from "../object/object";

const TRUE = new BooleanObj(true);
const FALSE = new BooleanObj(false);
export const NULL = new NullObj();

export function evaluate(node: Node): Obj | null {
  switch (node.constructor.name) {
    // Statements
    case "Program": {
      return evalProgram((node as Program).statements);
    }
    case "BlockStatement": {
      return evalBlockStatement(node as BlockStatement);
    }
    case "ExpressionStatement": {
      return evaluate((node as ExpressionStatement).expression);
    }
    case "ReturnStatement": {
      const returnValue = (node as ReturnStatement).returnValue;
      if (!returnValue) {
        return NULL;
      }
      const value = evaluate(returnValue);

      if (!value) {
        return NULL;
      }
      return new ReturnValue(value);
    }

    // Expressions
    case "IntegerLiteral": {
      return new Integer((node as IntegerLiteral).value);
    }
    case "BooleanLiteral": {
      return nativeBoolToBooleanObject((node as BooleanLiteral).value);
    }
    case "PrefixExpression": {
      const right = evaluate((node as PrefixExpression).right);
      return evalPrefixExpression((node as PrefixExpression).operator, right);
    }
    case "InfixExpression": {
      const left = evaluate((node as InfixExpression).left);
      const right = evaluate((node as InfixExpression).right);
      if (!right || !left) {
        return NULL;
      }
      return evalInfixExpression(
        (node as InfixExpression).operator,
        left,
        right,
      );
    }
    case "IfExpression": {
      return evalIfExpression(node as IfExpression);
    }
  }

  return null;
}

function evalBlockStatement(block: BlockStatement): Obj {
  let result: Obj = NULL;

  for (const statement of block.statements) {
    const evaluated = evaluate(statement);
    if (evaluated) {
      result = evaluated;
    }

    if (result && result.type === RETURN_VALUE_OBJ) {
      return result;
    }
  }
  return result;
}

function evalIfExpression(ifexp: IfExpression): Obj | null {
  if (!ifexp.condition) {
    return NULL;
  }
  const condition = evaluate(ifexp.condition);

  if (isTruthy(condition) && ifexp.consequence) {
    return evaluate(ifexp.consequence);
  } else if (ifexp.alternative) {
    return evaluate(ifexp.alternative);
  } else {
    return NULL;
  }
}

function evalInfixExpression(
  operator: string,
  left: Obj,
  right: Obj,
): Obj | null {
  switch (true) {
    case left.type === INTEGER_OBJ && right.type === INTEGER_OBJ: {
      return evalIntegerInfixExpression(
        operator,
        left as Integer,
        right as Integer,
      );
    }
    case operator === "==": {
      return nativeBoolToBooleanObject(left === right);
    }
    case operator === "!=": {
      return nativeBoolToBooleanObject(left !== right);
    }
    default: {
      return NULL;
    }
  }
}

function evalPrefixExpression(operator: string, right: Obj | null): Obj {
  switch (operator) {
    case "!":
      return evalBangOperatorExpression(right);
    case "-":
      return evalMinusePrefixExpression(right);
    default:
      return NULL;
  }
}

function evalIntegerInfixExpression(
  operator: string,
  left: Integer,
  right: Integer,
): Obj {
  const leftVal = left.value;
  const rightVal = right.value;
  switch (operator) {
    case "+":
      return new Integer(leftVal + rightVal);
    case "-":
      return new Integer(leftVal - rightVal);
    case "*":
      return new Integer(leftVal * rightVal);
    case "/":
      return new Integer(leftVal / rightVal);
    case "<":
      return nativeBoolToBooleanObject(leftVal < rightVal);
    case ">":
      return nativeBoolToBooleanObject(leftVal > rightVal);
    case "==":
      return nativeBoolToBooleanObject(leftVal === rightVal);
    case "!=":
      return nativeBoolToBooleanObject(leftVal !== rightVal);
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

function evalMinusePrefixExpression(right: Obj | null): Obj {
  if (!right || right?.type !== INTEGER_OBJ) {
    return NULL;
  }
  const value = (right as Integer).value;
  return new Integer(-value);
}

function evalProgram(statements: Statement[]): Obj | null {
  let result: Obj | null = null;
  for (const statement of statements) {
    result = evaluate(statement);
    if (result && result instanceof ReturnValue) {
      return result.value;
    }
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

function isTruthy(obj: Obj | null): boolean {
  switch (obj) {
    case NULL:
      return false;
    case TRUE:
      return true;
    case FALSE:
      return false;
    default:
      return true;
  }
}
