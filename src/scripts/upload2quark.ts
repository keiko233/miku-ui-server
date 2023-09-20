import { uploadFile } from "../utils/quark";

uploadFile(
  "test.zip",
  (result: any) => {
    console.log(result);
  }
);
