import * as readline from "readline";
import { Lexer } from "../lexer/lexer";
import { TokenType } from "../token/token";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PROMPT = ">> ";

export function start() {
  rl.on("line", (input) => {
    const lexer = new Lexer(input);
    for (
      let tok = lexer.nextToken();
      tok.type !== TokenType.EOF;
      tok = lexer.nextToken()
    ) {
      console.log(tok);
    }
    rl.prompt();
  }).on("close", () => {
    console.log("REPL terminated");
    process.exit(0);
  });

  rl.setPrompt(PROMPT);
  rl.prompt();
}
