import { uploadFile } from "../utils/aliyun";

const path = process.argv[2];

uploadFile([path], "test", (result: any) => {
  console.log(result);
});
