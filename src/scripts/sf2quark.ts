import { deleteFolder, readFilesInDirectory } from "../utils/fileUtils";
import { uploadFile } from "../utils/quark";
import { downloadFilesSequentially } from "../utils/shellUtils";
import { getSourceforgeFilesUrls } from "../utils/sourceforge";
import { config } from '../utils/config';

const url = process.argv[2];

const download = async () => {
  const result = await getSourceforgeFilesUrls(url);
  console.log(result);

  console.log('Staring download.');
  await downloadFilesSequentially(result);
  console.log('Download complete.');

  const filePaths = readFilesInDirectory(config.data_path + 'sourceforge.net')

  let completedCount = 0;

  filePaths.forEach((path: string) => {
    uploadFile(
      path,
      (result: any) => {
        console.log(result);
        if (result.completed) {
          completedCount++;
          if (completedCount == filePaths.length) {
            deleteFolder(config.data_path + 'sourceforge.net')
          }
        }
      }
    );
  });
};

download();
