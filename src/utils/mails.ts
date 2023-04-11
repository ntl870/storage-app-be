import { User } from '@modules/user/user.entity';

export const getSharedFolderHtmlBody = (
  fromUser: User,
  toUser: User,
  message: string,
  folderUrl: string,
) => {
  return `
        <h1>Hi ${toUser.name}</h1>
        <p>${fromUser.name} - ${fromUser.email} wanted you to contribute to a folder.</p>
        <p>Message: ${message}</p>
        <p>Folder URL: <a>${folderUrl}</a></p>
    `;
};
