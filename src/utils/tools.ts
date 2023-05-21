import { hashSync, compareSync } from 'bcrypt';
import {
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { ncp } from 'ncp';
import { EnvVar } from 'src/types';

export const hashPassword = (password: string, salt = 10) =>
  hashSync(password, salt);

export const comparePassword = (
  firstPassword: string,
  secondPassword: string,
) => compareSync(firstPassword, secondPassword);

export const getEnvVar = (key: EnvVar) => {
  return process.env[key] || '';
};

export const getFileType = (url: string) => {
  const extension = url.split('.').pop().toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'jpg':
    case 'jpeg':
      return 'jpg';
    case 'png':
      return 'png';
    case 'svg':
      return 'svg';
    case 'gif':
      return 'gif';
    case 'mp4':
      return 'mp4';
    case 'avi':
      return 'avi';
    case 'wmv':
      return 'wmv';
    case 'mkv':
      return 'mkv';
    case 'mov':
      return 'mov';
    case 'mp3':
      return 'mp3';
    case 'wav':
      return 'wav';
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
    case 'bz2':
      return 'archive';
    case 'txt':
    case 'md':
    case 'html':
    case 'htm':
    case 'css':
    case 'js':
    case 'json':
    case 'xml':
    case 'sql':
    case 'c':
    case 'cpp':
    case 'h':
    case 'hpp':
    case 'py':
    case 'rb':
    case 'java':
    case 'kt':
    case 'swift':
    case 'cs':
      return 'text';
    default:
      return 'unknown';
  }
};

export const deleteFile = (path: string) => {
  unlinkSync(path);
};

export const deleteFolder = (path: string) => {
  try {
    rmSync(path, { recursive: true });
  } catch (err) {
    console.log(err);
  }
};

export const renameFolder = (oldPath: string, newPath: string) => {
  try {
    renameSync(`${process.cwd()}${oldPath}`, `${process.cwd()}${newPath}`);
  } catch (err) {
    console.log(err);
  }
};

export const copyFolder = (oldPath: string, newPath: string) => {
  try {
    ncp(`${process.cwd()}${oldPath}`, `${process.cwd()}${newPath}`, (err) => {
      if (err) console.log(err);
    });
  } catch (err) {
    console.log(err);
  }
};

export const getFilesizeInBytes = (filePath: string) => {
  const stats = statSync(`${process.cwd()}${filePath}`);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes;
};

export const getFolderSize = (folderPath: string) => {
  let totalSize = 0;

  const files = readdirSync(`${process.cwd()}${folderPath}`);

  for (const file of files) {
    const filePath = `${folderPath}/${file}`;
    const stats = statSync(`${process.cwd()}${filePath}`);

    if (stats.isFile()) {
      totalSize += stats.size;
    }

    if (stats.isDirectory()) {
      totalSize += getFolderSize(filePath);
    }
  }

  return totalSize;
};

export const moveFolderToNewFolder = (
  oldPath: string,
  newPath: string,
  folderName: string,
) => {
  try {
    renameSync(
      `${process.cwd()}${oldPath}/${folderName}`,
      `${process.cwd()}${newPath}/${folderName}`,
    );
  } catch (err) {
    console.log(err);
  }
};

export const moveFileToNewFolder = (
  oldPath: string,
  newPath: string,
  fileName: string,
) => {
  try {
    renameSync(`${process.cwd()}${oldPath}`, `${process.cwd()}${newPath}`);
  } catch (err) {
    console.log(err);
  }
};

export const copyFileSync = (
  sourceFilePath: string,
  destinationFilePath: string,
) => {
  const fileContent = readFileSync(`${process.cwd()}/${sourceFilePath}`);

  writeFileSync(`${process.cwd()}/${destinationFilePath}`, fileContent);
};

export const groupFilesByFolder = (files: Array<Express.Multer.File>) => {
  const folders = [];

  for (const file of files) {
    const path = file.originalname.split('/');
    const folderName = path[0];

    // Check if folder already exists in folders array
    let folder: any = folders.find((f) => f.name === folderName);

    // If folder doesn't exist, create it and add to folders array
    if (!folder) {
      folder = {
        name: folderName,
        files: [],
        folders: [],
      };
      folders.push(folder);
    }

    // Traverse subfolders and create them if they don't exist
    let currentFolder = folder;
    for (let i = 1; i < path.length - 1; i++) {
      const subfolderName = path[i];
      let subfolder = currentFolder.folders.find(
        (f: File) => f.name === subfolderName,
      );
      if (!subfolder) {
        subfolder = {
          name: subfolderName,
          files: [],
          folders: [],
        };
        currentFolder.folders.push(subfolder);
      }
      currentFolder = subfolder;
    }

    // Add file to current folder
    currentFolder.files.push(file);
  }

  return folders;
};
