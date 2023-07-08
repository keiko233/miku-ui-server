import { getSourceforgeFilesUrls } from "../utils/sourceforge";
import { downloadFilesSequentially } from '../utils/shellUtils';

const example = async () => {
  const result = await getSourceforgeFilesUrls('https://sourceforge.net/projects/divarelease/files/mona_TDA_v0.18.0/');
  console.log(result);

  downloadFilesSequentially(result);
}

example();
