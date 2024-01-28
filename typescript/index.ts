import * as os from "os";
import { start } from "./repl/repl";

function main() {
  try {
    const user = os.userInfo();
    console.log(
      `Hello ${user.username}! This is the Monkey programming language!`,
    );
    console.log("Feel free to type in commands");

    start();
  } catch (err) {
    console.error("An error occurred:", err);
    process.exit(1);
  }
}

main();

