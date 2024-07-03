import readline from "node:readline";
export const readChar = (question: string): Promise<string> => {
  console.log(question);
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");

    const onData = (key: Buffer) => {
      const char = key.toString("utf-8");
      stdin.setRawMode(false);
      stdin.removeListener("data", onData);
      resolve(char);
    };
    process.stdin.resume();
    stdin.once("data", onData);
  });
};

export const readLine = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};
