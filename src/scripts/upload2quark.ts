import { uploadFile } from "../utils/quark";

const path = process.argv[2];

uploadFile(
  path,
  (result: any) => {
    console.log(result);
  }
);
