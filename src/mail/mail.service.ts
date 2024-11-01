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
                tls: {
                    rejectUnauthorized: false
                }                
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
    async sendResetPasswordEmail(email: string, resetLink: string): Promise<void> {
        const subject = 'Restablecimiento de contraseña';
        const textContent = `Hola,

        Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para cambiar tu contraseña:

        ${resetLink}

        Si no solicitaste este cambio, ignora este correo.`;

        const htmlContent = `
        <p>Hola,</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para cambiar tu contraseña:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Si no solicitaste este cambio, ignora este correo.</p>
      `;

        await this.sendEmail({
            to: email,
            subject,
            text: textContent,
            html: htmlContent,
        });
    }
}
