import { Injectable } from '@nestjs/common';
import { getEnvVar } from '@utils/tools';
import * as nodemailer from 'nodemailer';
import { EnvVar } from 'src/types';
import { OAuth2Client } from 'google-auth-library';
import * as ejs from 'ejs';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      getEnvVar(EnvVar.OAUTH_CLIENT_ID),
      getEnvVar(EnvVar.OAUTH_SECRET),
    );

    this.oauth2Client.setCredentials({
      refresh_token: getEnvVar(EnvVar.OAUTH_REFRESH_TOKEN),
    });
  }

  async sendMail(to: string, subject: string, data: any) {
    try {
      const accessToken = (await this.oauth2Client.getAccessToken()).token;
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: getEnvVar(EnvVar.MAIL_USER_NAME),
          clientId: getEnvVar(EnvVar.OAUTH_CLIENT_ID),
          clientSecret: getEnvVar(EnvVar.OAUTH_SECRET),
          refreshToken: getEnvVar(EnvVar.OAUTH_REFRESH_TOKEN),
          accessToken,
        },
      });
      const html = await this.readEmailTemplate(data);
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"Storage App Mail Bot" <${getEnvVar(EnvVar.MAIL_USER_NAME)}>`, // sender address
        to, // list of receivers
        subject, // Subject line
        html, // html body
      };
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw error;
    }
  }

  async readEmailTemplate(data) {
    return ejs.renderFile(
      `${process.cwd()}/src/modules/mail/templates/shared.html`,
      data,
    );
  }
}
