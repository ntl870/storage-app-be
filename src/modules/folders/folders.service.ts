import { DB } from '@db/db';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { Folder } from './folders.entity';
import {
  GetFoldersByOwnerIDPaginationResponse,
  NewFolderInput,
  PeopleWithAccessResponse,
  UploadFolderInput,
} from './folders.types';
import { createWriteStream, mkdirSync } from 'fs';
import { copyFolder, moveFolderToNewFolder } from '@utils/tools';
import { FilesService } from '@modules/files/files.service';
import * as archiver from 'archiver';
import { Response } from 'express';
import {
  deleteFile,
  deleteFolder,
  getEnvVar,
  renameFolder,
} from '@utils/tools';
import { User } from '@modules/user/user.entity';
import { ErrorException } from '@utils/exceptions';
import { UserService } from '@modules/user/user.service';
import { MailService } from '@modules/mail/mail.service';
import { EnvVar } from 'src/types';

@Injectable()
export class FoldersService {
  folderRepository: Repository<Folder>;
  constructor(
    @Inject(forwardRef(() => FilesService))
    private readonly fileService: FilesService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {
    this.folderRepository = DB.getInstance().getRepository(Folder);
  }

  canModify(userID: string, folder: Folder) {
    return (
      String(folder?.ownerID) === String(userID) ||
      !!folder?.sharedUsers?.find(
        (user: User) => String(user.ID) === String(userID),
      ) ||
      folder?.isPublic
    );
  }

  canAccess(userID: string, folder: Folder) {
    return (
      String(folder?.ownerID) === String(userID) ||
      !!folder?.readonlyUsers?.find(
        (user: User) => String(user.ID) === String(userID),
      ) ||
      !!folder?.sharedUsers?.find(
        (user: User) => String(user.ID) === String(userID),
      ) ||
      folder?.isPublic
    );
  }

  async createFolder(userID: string, input: NewFolderInput): Promise<Folder> {
    try {
      const rootFolder = input.rootFolderID
        ? await this.folderRepository.findOne({
            where: {
              ID: input.rootFolderID,
            },
          })
        : null;

      if (!this.canModify(userID, rootFolder) && !!rootFolder) {
        throw ErrorException.forbidden(
          'You are not allowed to create a folder in this folder',
        );
      }

      const owner = await this.userService.getOneByID(
        rootFolder?.ownerID || userID,
      );
      const newFolder = await this.folderRepository.save({
        name: input.name,
        ownerID: rootFolder?.ownerID || userID,
        owner,
        rootFolder,
      });
      const path = !!rootFolder
        ? `${rootFolder?.path}/${newFolder.name}`
        : `/files/${newFolder.ID}`;

      mkdirSync(`${process.cwd()}${path}`, {
        recursive: true,
      });

      return await this.folderRepository.save({
        ...newFolder,
        path,
      });
    } catch (err) {
      throw new Error(err);
    }
  }

  async handleSaveFolder(
    userID: string,
    input: UploadFolderInput,
    parentFolder?: Folder,
  ) {
    let rootFolder: Folder;
    if (!parentFolder) {
      rootFolder = await this.createFolder(userID, {
        name: input.folder.name,
        rootFolderID: input.rootFolderID,
      });
    } else {
      rootFolder = parentFolder;
    }

    await Promise.all(
      input.folder.files.map(async (file) => {
        return await this.fileService.saveFileToStorageRestful(
          file,
          userID,
          rootFolder.ID,
        );
      }),
    );

    if (input.folder.folders.length > 0) {
      await Promise.all(
        input.folder.folders.map(async (folder) => {
          const newFolder = await this.createFolder(userID, {
            name: folder.name,
            rootFolderID: rootFolder.ID,
          });

          await this.handleSaveFolder(
            userID,
            {
              folder,
              rootFolderID: newFolder.ID,
            },
            newFolder,
          );
        }),
      );
    }
  }

  async uploadFolder(userID: string, input: any) {
    try {
      const rootFolder = await this.getFolderByID(input.rootFolderID);
      if (!this.canModify(userID, rootFolder)) {
        throw ErrorException.forbidden(
          'You are not allowed to upload a folder to this folder',
        );
      }
      await this.handleSaveFolder(rootFolder.ownerID, input);
      return 'Upload folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async getFolderByID(folderID: string): Promise<Folder> {
    return await this.folderRepository.findOne({
      where: {
        ID: folderID,
      },
      relations: ['rootFolder', 'sharedUsers'],
    });
  }

  async getFolderByIDWithRelations(
    folderID: string,
    relations: string[],
  ): Promise<Folder> {
    return await this.folderRepository.findOne({
      where: {
        ID: folderID,
      },
      relations,
    });
  }

  async getFoldersOfFolder(
    userID: string,
    folderID: string,
  ): Promise<Folder[]> {
    try {
      const currentFolder = await this.folderRepository.findOne({
        where: {
          ID: folderID,
        },
        relations: ['sharedUsers', 'readonlyUsers'],
      });
      if (!this.canAccess(userID, currentFolder)) {
        throw ErrorException.forbidden(
          'You are not allowed to access this folder',
        );
      }
      return await this.folderRepository.find({
        where: {
          rootFolder: {
            ID: folderID,
          },
        },
        relations: ['rootFolder'],
      });
    } catch (err) {
      throw err;
    }
  }

  async downloadFolder(res: Response, folderID: string, userID?: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      // if (!this.canAccess(userID, folder)) {
      //   throw ErrorException.forbidden(
      //     'You are not allowed to download this folder',
      //   );
      // }
      const sourceDir = process.cwd() + folder.path;
      const zipFilePath = `${sourceDir}.zip`;
      const output = createWriteStream(sourceDir + '.zip');
      // create an archiver object to generate the zip file
      const archive = archiver('zip', {
        zlib: { level: 9 }, // set the compression level
      });

      // listen for errors on the output stream
      await new Promise((resolve, reject) => {
        archive
          .directory(sourceDir, false)
          .on('error', (err) => reject(err))
          .pipe(output);

        output.on('close', () => resolve('close'));
        archive.finalize();
      });
      res.download(zipFilePath, folder.name + '.zip', () => {
        deleteFile(zipFilePath);
      });
    } catch (err) {
      throw err;
    }
  }

  async moveFolderToTrash(folderID: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      await this.folderRepository.save({
        ...folder,
        isTrash: true,
      });
      return 'Move folder to trash successfully';
    } catch (err) {
      throw err;
    }
  }

  async getTrashFolder(userID: string): Promise<Folder[]> {
    try {
      return await this.folderRepository.find({
        where: {
          ownerID: userID,
          isTrash: true,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async moveFolderOutOfTrash(folderID: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      await this.folderRepository.save({
        ...folder,
        isTrash: false,
      });
      return 'Move folder out of trash successfully';
    } catch (err) {
      throw err;
    }
  }

  async deleteFolderForever(folderID: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      await this.folderRepository.remove(folder);
      deleteFolder(`${process.cwd()}${folder.path}`);
      return 'Delete folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async getArrayOfRootFoldersName(folderID: string) {
    const folder = await this.getFolderByID(folderID);
    const rootFolder = folder?.rootFolder;
    if (rootFolder) {
      return [folder, ...(await this.getArrayOfRootFoldersName(rootFolder.ID))];
    }
    return [folder];
  }

  async makeFolderPublic(userID: string, folderID: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      if (!this.canModify(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to make this folder public',
        );
      }
      await this.folderRepository.save({
        ...folder,
        isPublic: true,
      });
      return 'Make folder public successfully';
    } catch (err) {
      throw err;
    }
  }

  async addUserToFolderSharedUsers(
    userID: string,
    folderID: string,
    sharedUserID: string[],
    shouldSendMail: boolean,
    userMessage: string,
    sentMail?: boolean,
  ) {
    try {
      const folder = await this.getFolderByIDWithRelations(folderID, [
        'sharedUsers',
        'readonlyUsers',
        'subFolders',
      ]);
      if (!this.canModify(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to modify this folder',
        );
      }
      const sentUser = await this.userService.getOneByID(userID);
      const addedUsers = await this.userService.getManyByArrayOfIDs(
        sharedUserID,
      );

      if (!folder.sharedUsers) folder.sharedUsers = [];

      addedUsers.forEach(async (user) => {
        if (!folder.sharedUsers?.includes(user)) {
          folder.sharedUsers.push(user);
        } else {
          throw ErrorException.badRequest('User already added');
        }

        if (shouldSendMail && !sentMail) {
          const folderUrl = `${getEnvVar(
            EnvVar.FRONT_END_URL,
          )}/folder/${folderID}`;

          await this.mailService.sendMail(
            user.email,
            'Folder shared with you',
            {
              fullName: user.name,
              senderName: sentUser.name,
              senderMail: sentUser.email,
              type: 'folder',
              message: userMessage,
              url: folderUrl,
            },
          );
        }
      });

      // Recursively add user to subfolders
      if (folder?.subFolders?.length) {
        for (const subFolder of folder.subFolders) {
          await this.addUserToFolderSharedUsers(
            userID,
            subFolder.ID,
            sharedUserID,
            shouldSendMail,
            userMessage,
            true,
          );
        }
      }

      await this.folderRepository.save(folder);

      return 'Add user to folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async addUserToFolderReadOnlyUsers(
    userID: string,
    folderID: string,
    readonlyUserIDs: string[],
    shouldSendMail: boolean,
    userMessage: string,
    sentMail?: boolean,
  ) {
    try {
      const folder = await this.getFolderByID(folderID);
      if (!this.canModify(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to make this folder public',
        );
      }

      const sentUser = await this.userService.getOneByID(userID);
      const addedUsers = await this.userService.getManyByArrayOfIDs(
        readonlyUserIDs,
      );

      if (!folder.readonlyUsers) folder.readonlyUsers = [];

      addedUsers.forEach(async (user) => {
        if (!folder.readonlyUsers?.includes(user)) {
          folder.readonlyUsers.push(user);
        } else {
          throw ErrorException.badRequest('User already added');
        }

        if (shouldSendMail && !sentMail) {
          const folderUrl = `${getEnvVar(
            EnvVar.FRONT_END_URL,
          )}/file/${folderID}`;

          await this.mailService.sendMail(
            user.email,
            'Folder shared with you',
            {
              fullName: user.name,
              senderName: sentUser.name,
              senderMail: sentUser.email,
              type: 'folder',
              message: userMessage,
              url: folderUrl,
            },
          );
        }
      });

      if (folder?.subFolders?.length) {
        for (const subFolder of folder.subFolders) {
          await this.addUserToFolderReadOnlyUsers(
            userID,
            subFolder.ID,
            readonlyUserIDs,
            shouldSendMail,
            userMessage,
            true,
          );
        }
      }
      await this.folderRepository.save(folder);

      return 'Add user to read only successfully';
    } catch (err) {
      throw err;
    }
  }

  async getPeopleWithAccess(
    userID: string,
    folderID: string,
  ): Promise<PeopleWithAccessResponse> {
    try {
      const folder = await this.folderRepository.findOne({
        where: {
          ID: folderID,
        },
        relations: ['sharedUsers', 'readonlyUsers'],
      });
      if (!this.canAccess(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to access this folder',
        );
      }
      const owner = await this.userService.getOneByID(folder.ownerID);
      return {
        readonlyUsers: folder.readonlyUsers,
        sharedUsers: folder.sharedUsers,
        isPublic: folder.isPublic,
        owner,
      };
    } catch (err) {
      throw err;
    }
  }

  async setGeneralAccessOfFolder(
    userID: string,
    folderID: string,
    isPublic: boolean,
  ) {
    try {
      const folder = await this.getFolderByID(folderID);
      if (!this.canModify(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to make this folder public',
        );
      }
      await this.folderRepository.save({
        ...folder,
        isPublic,
      });
      return 'Set general access of folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async removeUserFromFolder(
    userID: string,
    folderID: string,
    targetUserID: string,
  ) {
    try {
      const folder = await this.getFolderByIDWithRelations(folderID, [
        'sharedUsers',
        'readonlyUsers',
        'subFolders',
      ]);
      if (!this.canModify(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to remove this user from folder',
        );
      }
      folder.sharedUsers = folder.sharedUsers.filter(
        (user) => String(user.ID) !== targetUserID,
      );

      folder.readonlyUsers = folder.readonlyUsers.filter(
        (user) => String(user.ID) !== targetUserID,
      );

      // Recursively remove the user from subfolders
      for (const subFolder of folder.subFolders) {
        await this.removeUserFromFolder(userID, subFolder.ID, targetUserID);
      }

      await this.folderRepository.save(folder);
      return 'Remove user from folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async changeUserRoleInFolder(
    userID: string,
    folderID: string,
    targetUserID: string,
    targetRole: 'Editor' | 'Viewer',
  ) {
    try {
      const folder = await this.getFolderByIDWithRelations(folderID, [
        'sharedUsers',
        'readonlyUsers',
      ]);
      if (!this.canModify(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to change this user role',
        );
      }
      const targetUser = await this.userService.getOneByID(targetUserID);

      if (targetRole === 'Editor') {
        folder.readonlyUsers = folder.readonlyUsers.filter(
          (user) => String(user.ID) !== targetUserID,
        );
        !!folder.sharedUsers
          ? folder.sharedUsers.push(targetUser)
          : [targetUser];
      }

      if (targetRole === 'Viewer') {
        folder.sharedUsers = folder.sharedUsers.filter(
          (user) => String(user.ID) !== targetUserID,
        );
        !!folder.readonlyUsers
          ? folder.readonlyUsers.push(targetUser)
          : [targetUser];
      }

      await this.folderRepository.save(folder);
      return 'Change user role successfully';
    } catch (err) {
      throw err;
    }
  }

  async emptyTrash(userID: string) {
    try {
      const trashFolders = await this.folderRepository.find({
        where: {
          ownerID: userID,
          isTrash: true,
        },
      });
      trashFolders.forEach(
        async (folder) => await this.deleteFolderForever(folder.ID),
      );
      const trashFiles = await this.fileService.getTrashFiles(userID);
      trashFiles.forEach(
        async (file) => await this.fileService.deleteFileForever(file.ID),
      );
      return 'Empty trash successfully';
    } catch (err) {
      throw err;
    }
  }

  async getUserSharedFolders(userID: string) {
    try {
      let sharedFolders = await this.folderRepository.find({
        where: {
          sharedUsers: {
            ID: userID,
          },
        },
        relations: ['rootFolder'],
      });
      sharedFolders = sharedFolders.filter((folder, _, arr) => {
        return !arr.find(
          (sharedFolder) => sharedFolder.ID === folder.rootFolder?.ID,
        );
      });

      let readonlyFolders = await this.folderRepository.find({
        where: {
          readonlyUsers: {
            ID: userID,
          },
        },
        relations: ['rootFolder'],
      });

      readonlyFolders = readonlyFolders.filter((folder, _, arr) => {
        return !arr.find(
          (readonlyFolder) => readonlyFolder.ID === folder.rootFolder?.ID,
        );
      });

      return [...sharedFolders, ...readonlyFolders];
    } catch (err) {
      throw err;
    }
  }

  async starFolder(userID: string, folderID: string) {
    try {
      const folder = await this.folderRepository.findOne({
        where: {
          ID: folderID,
        },
        relations: ['starredUsers'],
      });

      if (!this.canAccess(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to access this folder',
        );
      }

      const user = await this.userService.getOneByID(userID);
      folder.starredUsers.push(user);
      await this.folderRepository.save(folder);
      return 'Star folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async getStarredFolders(userID: string): Promise<Folder[]> {
    try {
      const folders = await this.folderRepository.find({
        where: {
          starredUsers: {
            ID: userID,
          },
        },
      });
      return folders;
    } catch (err) {
      throw err;
    }
  }

  async removeStarredFolder(userID: string, folderID: string) {
    try {
      const folder = await this.folderRepository.findOne({
        where: {
          ID: folderID,
        },
        relations: ['starredUsers'],
      });
      folder.starredUsers = folder.starredUsers.filter(
        (user) => user.ID !== userID,
      );
      await this.folderRepository.save(folder);
      return 'Remove starred folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async renameFolder(userID: string, folderID: string, name: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      if (!this.canModify(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to rename this folder',
        );
      }
      const oldPath = folder.path;
      const newPath = oldPath.replace(folder.name, name);
      renameFolder(oldPath, newPath);
      await this.folderRepository.update(folderID, {
        name,
        path: newPath,
      });
      return 'Rename folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async makeCopyOfFolder(userID: string, folderID: string) {
    try {
      const folder = await this.getFolderByIDWithRelations(folderID, [
        'files',
        'subFolders',
        'rootFolder',
      ]);
      if (!this.canAccess(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to make copy of this folder',
        );
      }
      const newFolderPath = folder.path.replace(
        folder.name,
        'Copy of ' + folder.name,
      );
      await this.folderRepository.save({
        ...folder,
        ID: undefined,
        name: 'Copy of ' + folder.name,
        path: newFolderPath,
      });

      copyFolder(folder.path, newFolderPath);

      return 'Make copy of folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async moveFolder(userID: string, folderID: string, targetFolderID: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      if (!this.canModify(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to move this folder',
        );
      }
      const targetFolder = await this.getFolderByID(targetFolderID);
      if (!this.canModify(userID, targetFolder)) {
        throw ErrorException.forbidden(
          'You are not allowed to move this folder',
        );
      }
      const oldPath = folder.path;

      const newPath = targetFolder.path + '/' + folder.name;

      moveFolderToNewFolder(oldPath, newPath, folder.name);

      await this.folderRepository.update(folderID, {
        path: newPath,
        rootFolder: targetFolder,
      });
      return 'Move folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async getFoldersPaginationByOwnerID(
    userID: string,
    search: string,
    page: number,
    limit: number,
  ): Promise<GetFoldersByOwnerIDPaginationResponse> {
    try {
      const [folders, total] = await this.folderRepository.findAndCount({
        where: [
          { name: Like(`%${search}%`) },
          {
            ownerID: userID,
          },
        ],
        take: limit,
        skip: (page - 1) * limit,
      });
      const hasMore = total > page * limit;

      return {
        results: folders,
        hasMore,
      };
    } catch (err) {
      throw err;
    }
  }

  async searchFilesAndFolders(userID: string, search: string) {
    try {
      const folders = await this.folderRepository.find({
        where: {
          name: Like(`%${search}%`),
          ownerID: userID,
        },
      });
      const files = await this.fileService.searchFiles(userID, search);
      return {
        folders,
        files,
      };
    } catch (err) {
      throw err;
    }
  }

  async getFolderDetail(folderID: string) {
    try {
      const folder = await this.getFolderByIDWithRelations(folderID, [
        'files',
        'subFolders',
        'rootFolder',
        'owner',
      ]);
      return folder;
    } catch (err) {
      throw err;
    }
  }

  async getAllFilesAndFoldersOfUser(userID: string) {
    try {
      const folders = await this.folderRepository.find({
        where: {
          owner: {
            ID: userID,
          },
          isTrash: false,
        },
      });
      const files = await this.fileService.getAllFilesOfUser(userID);
      return {
        folders,
        files,
      };
    } catch (err) {
      throw err;
    }
  }
}
