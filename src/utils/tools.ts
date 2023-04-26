import { hashSync, compareSync } from 'bcrypt';
import {
  copyFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
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
      return 'text';
    default:
      return 'unknown';
  }
};

export const deleteFile = (path: string) => {
  unlinkSync(path);
};

export const deleteFolder = (path: string) => {
  rmSync(path, { recursive: true });
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
      if (err) throw err;
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
