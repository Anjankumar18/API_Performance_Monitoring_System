import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ALERT_EMAIL,
      pass: process.env.ALERT_EMAIL_PASSWORD,
    },
  });

  async sendAlert(subject: string, message: string) {
    await this.transporter.sendMail({
      from: process.env.ALERT_EMAIL,
      to: process.env.ALERT_RECEIVER,
      subject,
      text: message,
    });

    this.logger.warn(`📧 Email alert sent: ${subject}`);
  }
}
