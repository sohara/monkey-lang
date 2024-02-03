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
  Identifier,
  LetStatement,
  StringLiteral,
} from "../ast/ast";
import {
  BooleanObj,
  INTEGER_OBJ,
  Integer,
  NullObj,
  ReturnValue,
  type Obj,
  RETURN_VALUE_OBJ,
  ErrorObj,
  ERROR_OBJ,
  Environment,
  StringObj,
} from "../object/object";

const TRUE = new BooleanObj(true);
const FALSE = new BooleanObj(false);
export const NULL = new NullObj();

export function evaluate(node: Node, env: Environment): Obj | null {
  switch (node.constructor.name) {
    // Statements
    case "Program": {
      return evalProgram((node as Program).statements, env);
    }
    case "BlockStatement": {
      return evalBlockStatement(node as BlockStatement, env);
    }
    case "ExpressionStatement": {
      return evaluate((node as ExpressionStatement).expression, env);
    }
    case "ReturnStatement": {
      const returnValue = (node as ReturnStatement).returnValue;
      if (!returnValue) {
        return NULL;
      }
      const value = evaluate(returnValue, env);

      if (!value) {
        return NULL;
      }
      if (isError(value)) {
        return value;
      }
      return new ReturnValue(value);
    }
    case "LetStatement": {
      const unEvaledVal = (node as LetStatement).value;
      if (!unEvaledVal) {
        return null;
      }
      const value = evaluate(unEvaledVal, env);
      if (!value) {
        return NULL;
      }
      if (isError(value)) {
        return value;
      }
      env.set((node as LetStatement).name.value, value);
      break;
    }

    // Expressions
    case "IntegerLiteral": {
      return new Integer((node as IntegerLiteral).value);
    }
    case "StringLiteral": {
      return new StringObj((node as StringLiteral).value);
    }
    case "BooleanLiteral": {
      return nativeBoolToBooleanObject((node as BooleanLiteral).value);
    }
    case "PrefixExpression": {
      const right = evaluate((node as PrefixExpression).right, env);
      if (isError(right)) {
        return right;
      }
      return evalPrefixExpression((node as PrefixExpression).operator, right);
    }
    case "InfixExpression": {
      const left = evaluate((node as InfixExpression).left, env);
      if (isError(left)) {
        return left;
      }
      const right = evaluate((node as InfixExpression).right, env);
      if (isError(right)) {
        return right;
      }
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
      return evalIfExpression(node as IfExpression, env);
    }
    case "Identifier": {
      return evalIdentifier(node as Identifier, env);
    }
  }

  return null;
}

function evalBlockStatement(block: BlockStatement, env: Environment): Obj {
  let result: Obj = NULL;

  for (const statement of block.statements) {
    const evaluated = evaluate(statement, env);
    if (evaluated) {
      result = evaluated;
    }

    if (
      result &&
      (result.type === RETURN_VALUE_OBJ || result.type === ERROR_OBJ)
    ) {
      return result;
    }
  }
  return result;
}

function evalIfExpression(ifexp: IfExpression, env: Environment): Obj | null {
  if (!ifexp.condition) {
    return NULL;
  }
  const condition = evaluate(ifexp.condition, env);
  if (isError(condition)) {
    return condition;
  }

  if (isTruthy(condition) && ifexp.consequence) {
    return evaluate(ifexp.consequence, env);
  } else if (ifexp.alternative) {
    return evaluate(ifexp.alternative, env);
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
    case left.type !== right.type:
      return newError(`type mismatch: ${left.type} ${operator} ${right.type}`);
    default: {
      return newError(
        `unknown operator: ${left.type} ${operator} ${right.type}`,
      );
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
      return newError(`unknown operator: ${operator} ${right?.type}`);
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
      return newError(
        `unknown operator: ${left.type} ${operator} ${right.type}`,
      );
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
    return newError(`unknown operation: -${right?.type}`);
  }
  const value = (right as Integer).value;
  return new Integer(-value);
}

function evalProgram(statements: Statement[], env: Environment): Obj | null {
  let result: Obj | null = null;
  for (const statement of statements) {
    result = evaluate(statement, env);
    if (result && result instanceof ReturnValue) {
      return result.value;
    } else if (result && result instanceof ErrorObj) {
      return result;
    }
  }
  return result;
}

function evalIdentifier(node: Identifier, env: Environment): Obj {
  const val = env.get(node.value);
  if (!val) {
    return newError(`identifier not found: ${node.value}`);
  }
  return val;
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

function newError(message: string) {
  return new ErrorObj(message);
}

function isError(obj: Obj | null): boolean {
  if (obj) {
    return obj.type === ERROR_OBJ;
  }
  return false;
}
