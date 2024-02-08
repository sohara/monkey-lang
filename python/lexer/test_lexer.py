from monkey_token import TokenType
from lexer import Lexer
import unittest


class TestLexer(unittest.TestCase):
    def testLexer(self):
        input = "=+(){},;"
        test_cases = [
            [TokenType.ASSIGN, "="],
            [TokenType.PLUS, "+"],
            [TokenType.LPAREN, "("],
            [TokenType.RPAREN, ")"],
            [TokenType.LBRACE, "{"],
            [TokenType.RBRACE, "}"],
            [TokenType.COMMA, ","],
            [TokenType.SEMICOLON, ";"],
            [TokenType.EOF, ""],
        ]

        lexer = Lexer(input)

        for test_case in test_cases:
            token_type, literal = test_case[0], test_case[1]
            token = lexer.next_token()
            assert token is not None, "Expected a token, but got None"
            assert token.type == token_type
            assert token.literal == literal
