import * as readline from "readline";
import { Lexer } from "../lexer/lexer";
import { TokenType } from "../token/token";
import { Parser } from "../parser/parser";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PROMPT = ">> ";

export function start() {
  rl.on("line", (input) => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    if (parser.errors.length > 0) {
      printParseErrors(parser.errors);
    }

    console.log(program.string);
    rl.prompt();
  }).on("close", () => {
    console.log("REPL terminated");
    process.exit(0);
  });

  rl.setPrompt(PROMPT);
  rl.prompt();
}

const MONKEY_FACE = `            __,__
   .--.  .-"     "-.  .--.
  / .. \/  .-. .-.  \/ .. \
 | |  '|  /   Y   \  |'  | |
 | \   \  \ 0 | 0 /  /   / |
  \ '- ,\.-"""""""-./, -' /
   ''-' /_   ^ ^   _\ '-''
       |  \._   _./  |
       \   \ '~' /   /
        '._ '-=-' _.'
           '-----'
`;

function printParseErrors(errors: string[]) {
  console.log(MONKEY_FACE);
  console.log("Whoops! We ran into some monkey business here!");
  console.log("Parser errors:");
  for (const error of errors) {
    console.log(error);
  }
}
