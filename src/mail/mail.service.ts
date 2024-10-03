import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { SendEmailOptions } from './send-email-options.interface';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Configura el transportador de Nodemailer
        this.transporter = nodemailer.createTransport(
            {
                host: process.env.MAIL_HOST,
                port: parseInt(process.env.MAIL_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.MAIL_USER,
                    pass: process.env.MAIL_PASS,
                },
            }
        );
    }
    async sendEmail(options: SendEmailOptions) {
        const mailOptions = {
            from: `"No Reply" <${process.env.MAIL_FROM}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Correo enviado a ${options.to}`);
        } catch (error) {
            console.error(`Error al enviar correo a ${options.to}:`, error);
        }
    }
}
