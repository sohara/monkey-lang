import unittest
from lexer import Lexer
from monkey_ast.ast import LetStatement, Statement, ReturnStatement
from .parser import Parser


class TestLetStatements(unittest.TestCase):
    def test_parser(self):
        input = """
let x = 5;
let y = 10;
let foobar = 838383;
"""

        lexer = Lexer(input)
        parser = Parser(lexer)
        program = parser.parse_program()
        check_parse_errors(parser)

        assert program is not None, "Expected a program, but got None"

        assert (
            len(program.statements) == 3
        ), f"program.statements does not contain 3 statements. got {len(program.statements)}"

        tests = ["x", "y", "foobar"]

        for i, expected in enumerate(tests):
            statement = program.statements[i]
            test_let_statement(statement, expected)

    def test_return_statements(self):
        input = """
return 5;
return 10;
return 993322;
"""
        lexer = Lexer(input)
        parser = Parser(lexer)
        program = parser.parse_program()
        check_parse_errors(parser)

        assert (
            len(program.statements) == 3
        ), f"program.statements does not contain 3 statements. got {len(program.statements)}"

        for statement in program.statements:
            assert isinstance(statement, ReturnStatement)
            assert (
                statement.token_literal() == "return"
            ), f"return statement token_literal not 'return', got {statement.token_literal()}"


def test_let_statement(statement: Statement, name: str):
    assert isinstance(statement, LetStatement)
    assert statement.name is not None
    assert (
        statement.name.token_literal() == name
    ), f"expected token_literal to be {name}. got {statement.name.token_literal()}"


def check_parse_errors(parser: Parser):
    errors = parser.errors
    assert len(errors) == 0, f"Parser has {len(errors)} errors:\n" + "\n".join(errors)
