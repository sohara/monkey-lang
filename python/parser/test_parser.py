import unittest
from lexer import Lexer
from monkey_ast.ast import (
    Expression,
    ExpressionStatement,
    Identifier,
    IntegerLiteral,
    LetStatement,
    PrefixExpression,
    Statement,
    ReturnStatement,
)
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

    def test_identifier_expressions(self):
        input = "foobar;"
        lexer = Lexer(input)
        parser = Parser(lexer)
        program = parser.parse_program()
        check_parse_errors(parser)

        assert (
            len(program.statements) == 1
        ), f"program.statements does not contain 1 statements. got {len(program.statements)}"

        statement = program.statements[0]
        assert isinstance(statement, ExpressionStatement)

        identifier = statement.expression
        assert isinstance(identifier, Identifier)

        assert (
            identifier.value == "foobar"
        ), f"identifer value not 'foobar', got {identifier.value}"
        assert (
            identifier.token_literal() == "foobar"
        ), f"identifer token_literal not 'foobar', got {identifier.token_literal()}"

    def test_integer_literal_expression(self):
        input = "5;"
        lexer = Lexer(input)
        parser = Parser(lexer)
        program = parser.parse_program()
        check_parse_errors(parser)

        assert (
            len(program.statements) == 1
        ), f"program.statements does not contain 1 statements. got {len(program.statements)}"

        statement = program.statements[0]
        assert isinstance(statement, ExpressionStatement)

        integer = statement.expression
        assert isinstance(integer, IntegerLiteral)

        assert integer.value == 5, f"integer value not '5', got {integer.value}"
        assert (
            integer.token_literal() == "5"
        ), f"integer token_literal not '5', got {integer.token_literal()}"

    def test_prefix_expressions(self):
        tests: list[tuple[str, str, int]] = [
            ("!5;", "!", 5),
            ("-15;", "-", 15),
        ]

        for input, operator, integerValue in tests:
            lexer = Lexer(input)
            parser = Parser(lexer)
            program = parser.parse_program()
            check_parse_errors(parser)

            assert (
                len(program.statements) == 1
            ), f"program.statements does not contain 1 statements. got {len(program.statements)}"

            statement = program.statements[0]
            assert isinstance(statement, ExpressionStatement)

            expression = statement.expression
            assert isinstance(expression, PrefixExpression)

            assert expression.operator is operator
            test_integer_literal(expression.right, integerValue)


def test_integer_literal(literal: Expression, expectedValue: int):
    assert isinstance(literal, IntegerLiteral)
    assert isinstance(literal.value, int)
    assert (
        literal.value is expectedValue
    ), f"expected expression.right to be {expectedValue}, got {literal.value}"
    assert (
        literal.token_literal() == str(expectedValue)
    ), f"expected expression.token_literal to be {expectedValue}, got {literal.token_literal()}"


def test_let_statement(statement: Statement, name: str):
    assert isinstance(statement, LetStatement)
    assert statement.name is not None
    assert (
        statement.name.token_literal() == name
    ), f"expected token_literal to be {name}. got {statement.name.token_literal()}"


def check_parse_errors(parser: Parser):
    errors = parser.errors
    assert len(errors) == 0, f"Parser has {len(errors)} errors:\n" + "\n".join(errors)
