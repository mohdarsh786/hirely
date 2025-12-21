import { getEnv } from '../env';

interface SendEmailParams {
    to: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
}

export async function sendEmail({ to, subject, htmlContent, textContent }: SendEmailParams) {
    const env = getEnv();
    const apiKey = env.BREVO_SMTP_API_KEY || env.BREVO_API_KEY;

    if (!apiKey) {
        throw new Error('BREVO_SMTP_API_KEY or BREVO_API_KEY is not defined');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: "Hirely HR",
                email: "msg.hirely@gmail.com"
            },
            to: [{ email: to }],
            subject: subject,
            htmlContent: htmlContent,
            textContent: textContent || htmlContent.replace(/<[^>]*>?/gm, '')
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
    }

    return await response.json();
}
