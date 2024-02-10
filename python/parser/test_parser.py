import unittest
from lexer import Lexer
from monkey_ast.ast import LetStatement, Statement
from .parser import Parser


class TestLetStatements(unittest.TestCase):
    def testParser(self):
        input = """
let x = 5;
let y = 10;
let foobar = 838383;
"""

        lexer = Lexer(input)
        parser = Parser(lexer)
        program = parser.parse_program()

        assert program is not None, "Expected a program, but got None"

        assert (
            len(program.statements) == 3
        ), f"program.statements does not contain 3 statements. got {len(program.statements)}"

        tests = ["x", "y", "foobar"]

        for i, expected in enumerate(tests):
            statement = program.statements[i]
            test_let_statement(statement, expected)


def test_let_statement(statement: Statement, name: str):
    assert isinstance(statement, LetStatement)
    assert statement.name is not None
    assert (
        statement.name.token_literal() == name
    ), f"expected token_literal to be {name}. got {statement.name.token_literal}"
