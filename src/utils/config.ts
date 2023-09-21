import { readFileSync } from "fs";

export const config = JSON.parse(readFileSync("config.json", "utf8"));
