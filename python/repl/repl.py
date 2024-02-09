import sys

# Assuming you have a lexer.py module with a Lexer class that has a similar interface to your Go lexer
from lexer import Lexer
from monkey_token import TokenType

PROMPT = ">> "


def start(in_stream, out_stream):
    while True:
        out_stream.write(PROMPT)
        out_stream.flush()
        try:
            line = in_stream.readline()
            if not line:  # EOF
                break
            lexer = Lexer(line)
            token = lexer.next_token()
            while token and token.type != TokenType.EOF:
                out_stream.write(f"{token}\n")
                token = lexer.next_token()
        except KeyboardInterrupt:
            out_stream.write("\nExiting...\n")
            break


if __name__ == "__main__":
    start(sys.stdin, sys.stdout)
