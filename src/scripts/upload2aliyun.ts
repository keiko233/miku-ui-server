import { uploadFile } from "../utils/aliyun";

const path = process.argv[2];

const floder = process.argv[3];

uploadFile([path], floder, (result: any) => {
  console.log(result);
});
