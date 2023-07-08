import { exec } from 'child_process';
import * as config from '../config.json';

export const downloadFile = (url: string, destination: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const command = `wget -q -w 1 -np -m -A download ${url} -P ${destination}`;

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      if (stderr) {
        reject(new Error(stderr));
        return;
      }

      resolve();
    });
  });
};

export const downloadFilesSequentially = async (files: string[]): Promise<void> => {
  for (const file of files) {
    try {
      console.log('Starting to download ' + file);
      await downloadFile(file, config.data_path);
      console.log('File downloaded successfully!');
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }
};
