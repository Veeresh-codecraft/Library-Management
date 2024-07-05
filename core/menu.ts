import { readChar } from "./input.utils";
import { choiceTheme, menuTitleTheme } from "./themes";

export interface IMenuItem {
  key: string;
  label: string;
}

export class Menu {
  constructor(
    private readonly title: string,
    private items: IMenuItem[] = []
  ) {}
  serialize(): string {
    let str = this.items.reduce((str, item) => {
      if (str) {
        str += "\n";
      }
      str += `${item.key}.\t${item.label}`;
      return str;
    }, `${menuTitleTheme(this.title)}`);
    str += `\n\nChoice: `;
    return str;
  }
  getItem(key: string): IMenuItem | null {
    return this.items.find((i) => i.key === key) || null;
  }

  async show() {
    const op = await readChar(this.serialize());
    const menuItem = this.getItem(op);
    if (menuItem) {
      console.log(
        `${choiceTheme(menuItem.key)}\t${choiceTheme(menuItem.label)}`
      );
      console.log("\n");
    } else {
      console.log(op);
    }
    return menuItem;
  }
}
