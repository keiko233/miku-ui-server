import { deleteFolder, readFilesInDirectory } from "../utils/fileUtils";
import { uploadFile } from "../utils/aliyun";
import { downloadFilesSequentially } from "../utils/shellUtils";
import { getSourceforgeFilesUrls } from "../utils/sourceforge";
import { config } from "../utils/config";

const url = process.argv[2];

const floderName = process.argv[3];

const onlyUpload = process.argv[4] == '--only-upload' ? true : false;

const download = async () => {
  if (!onlyUpload) {
    const result = await getSourceforgeFilesUrls(url);
    console.log(result);
  
    console.log("Staring download.");
    await downloadFilesSequentially(result);
    console.log("Download complete.");
  } else {
    console.log('With --only-upload args.');
  };

  const filePaths = readFilesInDirectory(config.data_path + "sourceforge.net");

  await uploadFile(filePaths, floderName, (result: any) => {
    console.log(result);
    if (result.completed) {
      deleteFolder(config.data_path + 'sourceforge.net');
    };
  });
};

download();
