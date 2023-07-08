import { exec } from 'child_process';
import { join, dirname } from 'path';
import { mkdirSync } from 'fs';
import * as config from '../config.json';

export const downloadFile = (url: string, destination: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const fileName = url.split('/').pop();
    const filePath = join(destination, dirname(url.replace('https://', '')), fileName);
    const directoryPath = dirname(filePath);

    try {
      mkdirSync(directoryPath, { recursive: true });
    } catch (error) {
      reject(error);
      return;
    }

    const command = `wget -q -w 1 -np -m -A download ${url} -O "${filePath}"`;

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

export const downloadFilesConcurrency = async (files: string[]): Promise<void> => {
  files.forEach(file => {
    downloadFile(file, config.data_path)
    .then(() => {
      console.log('File downloaded successfully!');
    })
    .catch((error) => {
      console.error('Error downloading file:', error);
    });
  });
};
