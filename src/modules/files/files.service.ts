import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { File } from '@modules/files/files.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { getRepository } from '@db/db';
import { Upload } from 'graphql-upload';
import { Folder } from '@modules/folders/folders.entity';
import { createWriteStream } from 'fs';
import { deleteFile, getFilesizeInBytes, getFileType } from '@utils/tools';
import { FoldersService } from '@modules/folders/folders.service';
import { ErrorException } from '@utils/exceptions';
import { Response } from 'express';
import { join } from 'path';
import { PeopleWithAccessResponse } from '@modules/folders/folders.types';
import { UserService } from '@modules/user/user.service';
import { MailService } from '@modules/mail/mail.service';
import { getSharedFolderHtmlBody } from '@utils/mails';

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
      file?.ownerID === String(userID) ||
      !!file?.sharedUsers?.find((user) => String(user.ID) === userID) ||
      file?.isPublic
    );
  }

  canAccess(userID: string, file: File) {
    return (
      file?.ownerID === String(userID) ||
      !!file?.readonlyUsers?.find((user) => String(user.ID) === userID) ||
      !!file?.sharedUsers?.find((user) => String(user.ID) === userID) ||
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
    return res.download(join(process.cwd(), `${file.url}`), file.name);
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
          const fileUrl = `http://localhost:3000/file/${fileID}`;
          await this.mailService.sendMail(
            user.email,
            'File shared with you',
            getSharedFolderHtmlBody(sentUser, user, userMessage, fileUrl),
          );
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
          const fileUrl = `http://localhost:3000/file/${fileID}`;
          await this.mailService.sendMail(
            user.email,
            'File shared with you',
            getSharedFolderHtmlBody(sentUser, user, userMessage, fileUrl),
          );
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

      await this.fileRepository.save({ ...file, name });
      return 'Rename file successfully';
    } catch (err) {
      throw err;
    }
  }
}
