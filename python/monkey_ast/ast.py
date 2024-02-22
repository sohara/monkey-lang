from abc import ABC, abstractmethod
from typing import List
from typing_extensions import Optional
from monkey_token.token import Token


class Node(ABC):
    @abstractmethod
    def token_literal(self) -> str:
        pass

    @abstractmethod
    def string(self) -> str:
        pass


class Statement(Node, ABC):
    pass


class Expression(Node, ABC):
    pass


class Program(Node):
    def __init__(self):
        self.statements: List[Statement] = []

    def token_literal(self) -> str:
        if self.statements:
            return self.statements[0].token_literal()
        else:
            return ""

    def string(self):
        return "".join(map(lambda x: x.string(), self.statements))


class Identifier(Expression):
    def __init__(self, token: Token, value: str):
        self.token = token
        self.value = value

    def token_literal(self) -> str:
        return self.token.literal

    def string(self) -> str:
        return self.value


class LetStatement(Statement):
    def __init__(
        self,
        token: Token,
        name: Optional[Identifier] = None,
        value: Optional[Expression] = None,
    ):
        self.token = token
        self.name = name
        self.value = value

    def token_literal(self) -> str:
        return self.token.literal

    def string(self) -> str:
        parts = [self.token_literal() + " "]

        if self.name:
            parts.append(self.name.string() + " = ")

        if self.value:
            parts.append(self.value.string())

        parts.append(";")
        return "".join(parts)


class ReturnStatement(Statement):
    def __init__(self, token: Token, return_value: Optional[Expression] = None):
        self.token = token
        self.return_value = return_value

    def token_literal(self) -> str:
        return self.token.literal

    def string(self) -> str:
        parts = [self.token_literal() + " "]

        if self.return_value:
            parts.append(self.return_value.string())

        parts.append(";")
        return "".join(parts)


class ExpressionStatement(Statement):
    def __init__(self, token: Token, expression: Optional[Expression] = None):
        self.token = token
        self.expression = expression

    def token_literal(self) -> str:
        return self.token.literal

    def string(self) -> str:
        string = ""
        if self.expression:
            string = self.expression.string()
        return string


class IntegerLiteral(Expression):
    def __init__(self, token: Token, value: Optional[int] = None) -> None:
        self.token = token
        self.value = value

    def token_literal(self) -> str:
        return self.token.literal

    def string(self) -> str:
        return self.token.literal


class PrefixExpression(Expression):
    def __init__(self, token: Token, operator: str, right: Expression) -> None:
        self.token = token
        self.operator = operator
        self.right = right

    def token_literal(self) -> str:
        return self.token.literal

    def string(self) -> str:
        return f"({self.operator}{self.right.string()})"


class InfixExpression(Expression):
    def __init__(
        self, token: Token, left: Expression, operator: str, right: Expression
    ) -> None:
        self.token = token
        self.left = left
        self.operator = operator
        self.right = right

    def token_literal(self) -> str:
        return self.token.literal

    def string(self) -> str:
        return f"({self.left.string()} {self.operator} {self.right.string()})"


class BooleanLiteral(Expression):
    def __init__(self, token: Token, value: bool) -> None:
        self.token = token
        self.value = value

    def token_literal(self) -> str:
        return self.token.literal

    def string(self) -> str:
        return self.token.literal
