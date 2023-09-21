import * as fs from "fs";
import * as path from "path";

export function deleteFilesInDirectory(directoryPath: string) {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error getting file stats:', err);
          return;
        }

        if (stats.isFile()) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
              return;
            }
            console.log('Deleted file:', filePath);
          });
        } else if (stats.isDirectory()) {
          deleteFilesInDirectory(filePath);
        }
      });
    });
  });
}

export function readFilesInDirectory(directoryPath: string) {
  let filePaths = [];

  fs.readdirSync(directoryPath).forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      filePaths.push(filePath);
    } else if (stats.isDirectory()) {
      filePaths = filePaths.concat(readFilesInDirectory(filePath));
    }
  });

  return filePaths;
};

export function deleteFolder(folderPath: string) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const filePath = `${folderPath}/${file}`;

      if (fs.lstatSync(filePath).isDirectory()) {
        deleteFolder(filePath);
      } else {
        fs.unlinkSync(filePath);
      }
    });

    fs.rmdirSync(folderPath);
    console.log(`Deleted folder: ${folderPath}`);
  } else {
    console.log(`Folder does not exist: ${folderPath}`);
  }
};