from abc import ABC, abstractmethod
from typing import List
from typing_extensions import Optional
from monkey_token.token import Token


class Node(ABC):
    @abstractmethod
    def token_literal(self) -> str:
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


class Identifier(Expression):
    def __init__(self, token: Token, value: str):
        self.token = token
        self.value = value

    def token_literal(self) -> str:
        return self.token.literal


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
