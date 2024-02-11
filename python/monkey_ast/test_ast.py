import unittest

from monkey_ast.ast import Identifier, LetStatement, Program
from monkey_token.token import Token, TokenType


class TestAST(unittest.TestCase):
    def test_string(self):
        program = Program()
        program.statements = [
            LetStatement(
                Token(TokenType.LET, "let"),
                Identifier(Token(TokenType.IDENT, "myVar"), "myVar"),
                Identifier(Token(TokenType.IDENT, "anotherVar"), "anotherVar"),
            )
        ]
        expected = "let myVar = anotherVar;"
        assert (
            program.string() == expected
        ), f"expected program.string() to be {expected}, got {program.string()}"
