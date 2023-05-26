import { forwardRef, Inject, Injectable, StreamableFile  } from '@nestjs/common';
import { File } from '@modules/files/files.entity';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { getRepository } from '@db/db';
import { Upload } from 'graphql-upload';
import { Folder } from '@modules/folders/folders.entity';
import { createWriteStream, copyFileSync, writeFileSync, renameSync,createReadStream } from 'fs';
import {
  deleteFile,
  getEnvVar,
  getFilesizeInBytes,
  getFileType,
  moveFileToNewFolder,
} from '@utils/tools';
import { FoldersService } from '@modules/folders/folders.service';
import { ErrorException } from '@utils/exceptions';
import { Response } from 'express';
import { join } from 'path';
import { PeopleWithAccessResponse } from '@modules/folders/folders.types';
import { UserService } from '@modules/user/user.service';
import { MailService } from '@modules/mail/mail.service';
import { EnvVar } from 'src/types';

@Injectable()
export class FilesService {
  fileRepository: Repository<File>;

  constructor(
    @Inject(forwardRef(() => FoldersService))
    private readonly folderService: FoldersService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {
    this.fileRepository = getRepository(File);
  }

  canModify(userID: string, file: File) {
    return (
      String(file?.ownerID) === String(userID) ||
      !!file?.sharedUsers?.find((user) => String(user.ID) === String(userID)) ||
      file?.isPublic
    );
  }

  canAccess(userID: string, file: File) {
    return (
      String(file?.ownerID) === String(userID) ||
      !!file?.readonlyUsers?.find(
        (user) => String(user.ID) === String(userID),
      ) ||
      !!file?.sharedUsers?.find((user) => String(user.ID) === String(userID)) ||
      file?.isPublic
    );
  }

  async create(input: File): Promise<File> {
    try {
      const savedFile = await this.fileRepository.save(input);
      return savedFile;
    } catch (err) {
      throw new Error(err);
    }
  }

  async findFileByOptions(
    options: FindOptionsWhere<File> | FindOptionsWhere<File>[],
  ): Promise<File[] | File> {
    return this.fileRepository.find({
      where: options,
    });
  }

  async getFileByID(ID: string): Promise<File> {
    return await this.fileRepository.findOne({
      where: {
        ID: ID,
      },
    });
  }

  async getFileDetail(fileID: string): Promise<File> {
    return await this.fileRepository.findOne({
      where: {
        ID: fileID,
      },
      relations: ['folder', 'sharedUsers', 'readonlyUsers', 'owner'],
    });
  }

  async getFileByIDWithAccess(userID: string, fileID: string): Promise<File> {
    try {
      const file = await this.fileRepository.findOne({
        where: {
          ID: fileID,
        },
      });
      if (!this.canAccess(userID, file)) {
        throw ErrorException.forbidden("You don't have access to this file");
      }
      return file;
    } catch (err) {
      throw err;
    }
  }

  async getUserFiles(userID: string): Promise<File[]> {
    try {
      return await this.fileRepository.find({
        where: {
          ownerID: userID,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async saveFileToStorageRestful(
    file: Express.Multer.File,
    userID: string,
    rootFolderID: string,
  ) {
    try {
      const rootFolder = await this.folderService.getFolderByID(rootFolderID);
      if (!this.folderService.canModify(userID, rootFolder)) {
        throw ErrorException.forbidden("You don't have access to this folder");
      }

      const { originalname } = file;
      const fileName =
        originalname.split('/')[originalname.split('/').length - 1];
      const path = `${rootFolder.path}/${fileName}`;

      writeFileSync(`${process.cwd()}${path}`, file.buffer);
      const fileOwner = await this.userService.getOneByID(rootFolder.ownerID);

      // Update user storage
      await this.userService.updateUserUsedStorage(fileOwner.ID);

      const newFile = new File();
      newFile.name = fileName;
      newFile.url = path;
      newFile.ownerID = rootFolder.ownerID;
      newFile.owner = fileOwner;
      newFile.folder = rootFolder;
      newFile.fileSize = file.size;
      newFile.fileType = getFileType(originalname);
      return await this.create(newFile);
    } catch (err) {
      console.log(err);
    }
  }

  async saveFileToStorage(
    file: Upload,
    userID: string,
    rootFolder: Folder,
  ): Promise<File> {
    if (!this.folderService.canModify(userID, rootFolder)) {
      throw ErrorException.forbidden("You don't have access to this folder");
    }
    const ownerID = rootFolder.ownerID;
    const { createReadStream, filename } = await file;

    try {
      const path = `${rootFolder.path}/${filename}`;

      await new Promise((resolve, reject) =>
        createReadStream()
          .pipe(createWriteStream(`${process.cwd()}/${path}`))
          .on('finish', () => resolve(path))
          .on('error', reject),
      );
      const fileOwner = await this.userService.getOneByID(ownerID);
      const fileSize = getFilesizeInBytes(path);

      // Update user storage
      await this.userService.updateUserUsedStorage(fileOwner.ID);

      const newFile = new File();
      newFile.name = filename;
      newFile.folder = rootFolder;
      newFile.url = path;
      newFile.ownerID = ownerID;
      newFile.fileType = getFileType(path);
      newFile.fileSize = fileSize;
      newFile.owner = fileOwner;
      return await this.create(newFile);
    } catch (err) {
      throw err;
    }
  }

  async getFilesOfFolder(folderID: string, userID: string) {
    const folder = await this.folderService.getFolderByIDWithRelations(
      folderID,
      ['sharedUsers', 'readonlyUsers'],
    );
    if (!this.folderService.canAccess(userID, folder)) {
      throw ErrorException.forbidden("You don't have access to this folder");
    }
    const files = await this.fileRepository.find({
      where: {
        folder: {
          ID: folderID,
        },
      },
    });
    return files;
  }

  async moveFileToTrash(fileID: string, userID: string) {
    try {
      const file = await this.getFileByID(fileID);
      if (!this.canModify(userID, file)) {
        throw ErrorException.forbidden(
          'You are not allowed move this file to trash',
        );
      }
      return await this.fileRepository.save({
        ...file,
        isTrash: true,
      });
    } catch (err) {
      throw err;
    }
  }

  async getTrashFiles(userID: string) {
    try {
      const files = await this.fileRepository.find({
        where: {
          ownerID: userID,
          isTrash: true,
        },
      });
      return files;
    } catch (err) {
      throw err;
    }
  }

  async moveFileOutOfTrash(fileID: string) {
    try {
      const file = await this.getFileByID(fileID);
      return await this.fileRepository.save({
        ...file,
        isTrash: false,
      });
    } catch (err) {
      throw err;
    }
  }

  async deleteFileForever(fileID: string) {
    try {
      const file = await this.getFileByID(fileID);
      await this.fileRepository.delete({
        ID: fileID,
      });
      deleteFile(`${process.cwd()}${file.url}`);
      return 'File deleted';
    } catch (err) {
      throw err;
    }
  }

  async downloadFile(res: Response, fileID: string) {
    const file = await this.getFileByID(fileID);
    // if (!this.canAccess(userID, file)) {
    //   throw ErrorException.forbidden("You don't have access to this file");
    // }
      // Set the appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename=${file.name}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Transfer-Encoding', 'chunked');
    const streamingFile = createReadStream(join(process.cwd(), `${file.url}`));
    streamingFile.pipe(res);
  }

  async addUsersToReadOnlyFile(
    userID: string,
    fileID: string,
    readonlyUserIDs: string[],
    shouldSendMail: boolean,
    userMessage: string,
  ) {
    try {
      const file = await this.fileRepository.findOne({
        where: {
          ID: fileID,
        },
        relations: ['readonlyUsers'],
      });

      if (!this.canModify(userID, file)) {
        throw ErrorException.forbidden(
          "You don't have permission to add user to this file",
        );
      }

      const sentUser = await this.userService.getOneByID(userID);
      const addedUsers = await this.userService.getManyByArrayOfIDs(
        readonlyUserIDs,
      );

      addedUsers.forEach(async (user) => {
        if (!file.readonlyUsers?.includes(user)) {
          file.readonlyUsers.push(user);
        } else {
          throw ErrorException.badRequest('User already added');
        }

        if (shouldSendMail) {
          const fileUrl = `${getEnvVar(EnvVar.FRONT_END_URL)}/file/${fileID}`;
          await this.mailService.sendMail(user.email, 'File shared with you', {
            fullName: user.name,
            senderName: sentUser.name,
            senderMail: sentUser.email,
            type: 'file',
            message: userMessage,
            url: fileUrl,
          });
        }
      });

      await this.fileRepository.save(file);

      return 'User added to readonly file';
    } catch (err) {
      throw err;
    }
  }

  async addUsersToSharedUserFile(
    userID: string,
    fileID: string,
    sharedUserIDs: string[],
    shouldSendMail: boolean,
    userMessage: string,
  ) {
    try {
      const file = await this.fileRepository.findOne({
        where: {
          ID: fileID,
        },
        relations: ['sharedUsers'],
      });

      if (!this.canModify(userID, file)) {
        throw ErrorException.forbidden(
          "You don't have permission to add user to this file",
        );
      }

      const sentUser = await this.userService.getOneByID(userID);
      const addedUsers = await this.userService.getManyByArrayOfIDs(
        sharedUserIDs,
      );

      addedUsers.forEach(async (user) => {
        if (!file.sharedUsers?.includes(user)) {
          file.sharedUsers.push(user);
        } else {
          throw ErrorException.badRequest('User already added');
        }

        if (shouldSendMail) {
          const fileUrl = `${getEnvVar(EnvVar.FRONT_END_URL)}/file/${fileID}`;
          await this.mailService.sendMail(user.email, 'File shared with you', {
            fullName: user.name,
            senderName: sentUser.name,
            senderMail: sentUser.email,
            type: 'file',
            message: userMessage,
            url: fileUrl,
          });
        }
      });
      await this.fileRepository.save(file);

      return 'User added to shared file';
    } catch (err) {
      throw err;
    }
  }

  async getPeopleWithAccessToFile(
    userID: string,
    fileID: string,
  ): Promise<PeopleWithAccessResponse> {
    const file = await this.fileRepository.findOne({
      where: {
        ID: fileID,
      },
      relations: ['readonlyUsers', 'sharedUsers'],
    });

    if (!this.canAccess(userID, file)) {
      throw ErrorException.forbidden("You don't have access to this file");
    }

    const owner = await this.userService.getOneByID(file.ownerID);

    return {
      readonlyUsers: file.readonlyUsers,
      sharedUsers: file.sharedUsers,
      isPublic: file.isPublic,
      owner,
    };
  }

  async changeUserRoleInFile(
    userID: string,
    fileID: string,
    targetUserID: string,
    targetRole: 'Editor' | 'Viewer',
  ) {
    try {
      const file = await this.fileRepository.findOne({
        where: {
          ID: fileID,
        },
        relations: ['readonlyUsers', 'sharedUsers'],
      });

      if (!this.canModify(userID, file)) {
        throw ErrorException.forbidden("You don't have access to this file");
      }
      const user = await this.userService.getOneByID(targetUserID);

      if (targetRole === 'Editor') {
        if (
          !file.sharedUsers.find((user) => String(user.ID) === targetUserID)
        ) {
          file.sharedUsers.push(user);
        }
        file.readonlyUsers = file.readonlyUsers.filter(
          (user) => String(user.ID) !== targetUserID,
        );
      }
      if (targetRole === 'Viewer') {
        if (
          !file.readonlyUsers.find((user) => String(user.ID) === targetUserID)
        ) {
          file.readonlyUsers.push(user);
        }
        file.sharedUsers = file.sharedUsers.filter(
          (user) => String(user.ID) !== targetUserID,
        );
      }

      await this.fileRepository.save(file);

      return 'Change user role successfully';
    } catch (err) {
      throw err;
    }
  }

  async removeUserFromFile(
    userID: string,
    fileID: string,
    targetUserID: string,
  ) {
    try {
      const file = await this.fileRepository.findOne({
        where: {
          ID: fileID,
        },
        relations: ['readonlyUsers', 'sharedUsers'],
      });

      if (!this.canModify(userID, file)) {
        throw ErrorException.forbidden("You don't have access to this file");
      }

      file.sharedUsers = file.sharedUsers.filter(
        (user) => String(user.ID) !== targetUserID,
      );
      file.readonlyUsers = file.readonlyUsers.filter(
        (user) => String(user.ID) !== targetUserID,
      );

      await this.fileRepository.save(file);

      return 'Remove user successfully';
    } catch (err) {
      throw err;
    }
  }

  async setGeneralAccessOfFile(
    userID: string,
    fileID: string,
    isPublic: boolean,
  ) {
    try {
      const file = await this.fileRepository.findOne({
        where: {
          ID: fileID,
        },
        relations: ['readonlyUsers', 'sharedUsers'],
      });

      if (!this.canModify(userID, file)) {
        throw ErrorException.forbidden("You don't have access to this file");
      }

      await this.fileRepository.save({ ...file, isPublic });

      return 'Change general access successfully';
    } catch (err) {
      throw err;
    }
  }

  async getUserSharedFiles(userID: string) {
    try {
      const sharedFiles = [
        ...(await this.fileRepository.find({
          where: {
            sharedUsers: {
              ID: userID,
            },
          },
        })),
        ...(await this.fileRepository.find({
          where: {
            readonlyUsers: {
              ID: userID,
            },
          },
        })),
      ];
      return sharedFiles;
    } catch (err) {
      throw err;
    }
  }

  async starFile(userID: string, fileID: string) {
    try {
      const file = await this.fileRepository.findOne({
        where: {
          ID: fileID,
        },
        relations: ['starredUsers'],
      });

      if (!this.canAccess(userID, file)) {
        throw ErrorException.forbidden("You don't have access to this file");
      }

      const user = await this.userService.getOneByID(userID);
      file.starredUsers.push(user);
      await this.fileRepository.save(file);
      return 'Star file successfully';
    } catch (err) {
      throw err;
    }
  }

  async getStarredFiles(userID: string) {
    try {
      const files = await this.fileRepository.find({
        where: {
          starredUsers: {
            ID: userID,
          },
        },
      });
      return files;
    } catch (err) {
      throw err;
    }
  }

  async unStarFile(userID: string, fileID: string) {
    try {
      const file = await this.fileRepository.findOne({
        where: {
          ID: fileID,
        },
        relations: ['starredUsers'],
      });

      file.starredUsers = file.starredUsers.filter(
        (user) => user.ID !== userID,
      );
      await this.fileRepository.save(file);
      return 'Unstar file successfully';
    } catch (err) {
      throw err;
    }
  }

  async renameFile(userID: string, fileID: string, name: string) {
    try {
      const file = await this.fileRepository.findOne({
        where: {
          ID: fileID,
        },
      });

      if (!this.canModify(userID, file)) {
        throw ErrorException.forbidden("You don't have access to this file");
      }
      // change url but keep extension
      const newFileUrl = file.url.replace(file.name, name);

      // Rename file
      renameSync(
        `${process.cwd()}/${file.url}`,
        `${process.cwd()}/${newFileUrl}`,
      );

      await this.fileRepository.save({ ...file, name, url: newFileUrl });
      return 'Rename file successfully';
    } catch (err) {
      throw err;
    }
  }

  async makeCopyOfFile(userID: string, fileID: string) {
    const file = await this.fileRepository.findOne({
      where: {
        ID: fileID,
      },
      relations: ['readonlyUsers', 'sharedUsers', 'folder'],
    });

    if (!this.canAccess(userID, file)) {
      throw ErrorException.forbidden("You don't have access to this file");
    }

    const newFilePath = file.url.replace(file.name, 'Copy of ' + file.name);

    await this.fileRepository.save({
      ...file,
      ID: undefined,
      name: 'Copy of ' + file.name,
      url: newFilePath,
      ownerID: file.ownerID,
    });

    copyFileSync(
      `${process.cwd()}${file.url}`,
      `${process.cwd()}${newFilePath}`,
    );

    return 'Make copy of file successfully';
  }

  async moveFileToFolder(
    userID: string,
    fileID: string,
    targetFolderID: string,
  ) {
    const file = await this.fileRepository.findOne({
      where: {
        ID: fileID,
      },
      relations: ['readonlyUsers', 'sharedUsers'],
    });
    if (!this.canModify(userID, file)) {
      throw ErrorException.forbidden('You are not allowed to move this file');
    }

    const targetFolder = await this.folderService.getFolderByID(targetFolderID);

    if (!this.folderService.canModify(userID, targetFolder)) {
      throw ErrorException.forbidden('You are not allowed to move this file');
    }

    const oldPath = file.url;

    const newPath = oldPath.replace(
      file.url,
      targetFolder.path + '/' + file.name,
    );

    moveFileToNewFolder(oldPath, newPath, file.name);

    await this.fileRepository.update(fileID, {
      url: newPath,
      folder: targetFolder,
    });

    return 'Move file to folder successfully';
  }

  async searchFiles(search: string) {
    try {
      const files = await this.fileRepository.find({
        where: {
          name: Like(`%${search}%`),
        },
      });
      return files;
    } catch (err) {
      throw err;
    }
  }

  async getAllFilesOfUser(userID: string) {
    try {
      const files = await this.fileRepository.find({
        where: {
          ownerID: userID,
        },
      });
      return files;
    } catch (err) {
      throw err;
    }
  }

  async updateFile(fileID: string, input: File) {
    try {
      return await this.fileRepository.update(fileID, input);
    } catch (err) {
      throw err;
    }
  }
}
