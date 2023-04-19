import { Injectable } from '@nestjs/common';
import { getEnvVar } from '@utils/tools';
import * as nodemailer from 'nodemailer';
import { EnvVar } from 'src/types';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private mailUserName: string;
  private mailPassword: string;

  constructor() {
    this.mailUserName = getEnvVar(EnvVar.MAIL_USER_NAME);
    this.mailPassword = getEnvVar(EnvVar.MAIL_PASSWORD);
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.mailUserName,
        pass: this.mailPassword,
      },
    });
  }

  sendMail(to: string, subject: string, html: string) {
    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"Storage App Mail Bot" <${this.mailUserName}>`, // sender address
        to, // list of receivers
        subject, // Subject line
        html, // html body
      };
      this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error('Error sending email');
    }
  }
}
