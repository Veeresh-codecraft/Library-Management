import  { emitKeypressEvents } from "node:readline";

export const readChar = (question: string): Promise<string> => {
  console.log(question);
  return new Promise((resolve) => {
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf8");

    const onData = async (key: Buffer) => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener("data",onData);
      const char = key.toString("utf-8");
      if (char.charCodeAt(0) === 3)
      { process.exit(0); }
      resolve(char);
    };

    process.stdin.once("data", onData);
  });
};

export const readLine = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const onData = async (key: Buffer) => {
      process.stdin.removeListener("data", onData);
      const input = key.toString("utf-8");
      resolve(input.trim());
    };
    process.stdin.addListener("data", onData);
  });
};    
