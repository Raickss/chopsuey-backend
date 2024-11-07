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
    async sendAccessEmail(email: string, username: string, password: string) {
        const subject = 'Acceso a tu cuenta';
        const textContent = `Hola,

Aquí están tus credenciales para acceder al sistema:
    
Usuario: ${username}
Contraseña temporal: ${password}
    
Por favor, inicia sesión y cambia tu contraseña lo antes posible.
    
Enlace de inicio de sesión: http://tu-dominio.com/login`;

        const htmlContent = `
      <p>Hola,</p>
      <p>Aquí están tus credenciales para acceder al sistema:</p>
      <ul>
        <li><strong>Usuario:</strong> ${username}</li>
        <li><strong>Contraseña temporal:</strong> ${password}</li>
      </ul>
      <p>Por favor, inicia sesión y cambia tu contraseña lo antes posible.</p>
      <p><a href="http://tu-dominio.com/login">Iniciar sesión</a></p>
    `;

        await this.sendEmail({
            to: email,
            subject,
            text: textContent,
            html: htmlContent,
        });
    }
}
