import { hashSync, compareSync } from 'bcrypt';
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
