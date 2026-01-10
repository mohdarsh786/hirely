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

export async function sendInterviewCompletionEmail(
    candidateName: string,
    candidateEmail: string,
    jobTitle: string,
    score: number
) {
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 0; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #ffffff; padding: 40px 30px; }
        .content p { margin: 15px 0; }
        .highlight { background: #667eea; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold; }
        .score-box { background: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .score-box strong { font-size: 24px; color: #667eea; }
        .next-steps { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .next-steps ul { margin: 10px 0; padding-left: 20px; }
        .next-steps li { margin: 8px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Interview Completed Successfully!</h1>
        </div>
        <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>Congratulations on completing the <span class="highlight">${jobTitle}</span> interview!</p>
            
            <p>We have successfully received your interview responses and our HR team is currently reviewing your performance.</p>
            
            <div class="next-steps">
                <p><strong>📋 What happens next?</strong></p>
                <ul>
                    <li>Our HR team will carefully review your interview responses</li>
                    <li>We'll evaluate your answers against our job requirements</li>
                    <li>If you're a good fit, we'll contact you shortly for the next steps</li>
                    <li>You can expect to hear from us within 3-5 business days</li>
                </ul>
            </div>
            
            <p>Thank you for your time and effort in completing this interview. We appreciate your interest in joining our team!</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The Hirely Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p style="margin-top: 5px; font-size: 12px;">© ${new Date().getFullYear()} Hirely. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await sendEmail({
            to: candidateEmail,
            subject: `Interview Completed Successfully - ${jobTitle}`,
            htmlContent: emailContent,
        });
        console.log(`[Email] Interview completion email sent to ${candidateEmail}`);
        return true;
    } catch (error) {
        console.error('[Email] Error sending interview completion email:', error);
        return false;
    }
}

export async function sendInterviewInvitation(
    candidateName: string,
    candidateEmail: string,
    jobTitle: string,
    scheduledAt: Date,
    durationMinutes: number,
    interviewToken: string
) {
    const env = getEnv();
    const interviewUrl = `${env.WEB_URL}/interview/token/${interviewToken}`;
    const scheduledDate = scheduledAt.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 0; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #ffffff; padding: 40px 30px; }
        .content p { margin: 15px 0; }
        .highlight { background: #3b82f6; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold; }
        .details-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .details-box p { margin: 8px 0; }
        .details-box strong { color: #1e40af; }
        .button-container { text-align: center; margin: 35px 0; }
        .button { 
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white !important;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
        }
        .link-box { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; word-break: break-all; }
        .link-box a { color: #3b82f6; text-decoration: none; font-size: 14px; }
        .tips { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .tips ul { margin: 10px 0; padding-left: 20px; }
        .tips li { margin: 5px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Interview Invitation</h1>
        </div>
        <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>Congratulations! You have been invited to participate in an AI-powered interview for the <span class="highlight">${jobTitle}</span> position.</p>
            
            <div class="details-box">
                <p><strong>📋 Interview Details:</strong></p>
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>📅 Scheduled Date & Time:</strong> ${scheduledDate}</p>
                <p><strong>⏱️ Duration:</strong> Approximately ${durationMinutes} minutes</p>
                <p><strong>💻 Format:</strong> AI-Powered Online Interview</p>
            </div>
            
            <p>Click the button below to access your interview at the scheduled time:</p>
            
            <div class="button-container">
                <a href="${interviewUrl}" class="button">Start Your Interview</a>
            </div>
            
            <div class="link-box">
                <p style="margin: 0; font-size: 13px; color: #666;">Or copy this link:</p>
                <a href="${interviewUrl}">${interviewUrl}</a>
            </div>
            
            <div class="tips">
                <p><strong>💡 Interview Tips:</strong></p>
                <ul>
                    <li>Ensure you have a stable internet connection</li>
                    <li>Find a quiet place with minimal distractions</li>
                    <li>Be prepared to answer questions about your experience and skills</li>
                    <li>Take your time to think before answering each question</li>
                    <li>Be honest and authentic in your responses</li>
                </ul>
            </div>
            
            <p>If you have any questions or need to reschedule, please contact our HR team.</p>
            
            <p style="margin-top: 30px;">We look forward to learning more about you!</p>
            
            <p style="margin-top: 20px;">Best regards,<br><strong>The Hirely Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p style="margin-top: 5px; font-size: 12px;">© ${new Date().getFullYear()} Hirely. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await sendEmail({
            to: candidateEmail,
            subject: `Interview Invitation - ${jobTitle}`,
            htmlContent: emailContent,
        });
        console.log(`[Email] Interview invitation sent to ${candidateEmail}`);
        return true;
    } catch (error) {
        console.error('[Email] Error sending interview invitation:', error);
        return false;
    }
}

export async function sendShortlistEmail(
    candidateName: string,
    candidateEmail: string,
    jobTitle: string,
    recruiterMessage?: string
) {
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 0; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #ffffff; padding: 40px 30px; }
        .content p { margin: 15px 0; }
        .highlight { background: #10b981; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .success-box p { margin: 8px 0; color: #065f46; }
        .message-box { background: #f0fdfa; padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic; color: #0f766e; }
        .next-steps { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .next-steps ul { margin: 10px 0; padding-left: 20px; }
        .next-steps li { margin: 8px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Congratulations!</h1>
        </div>
        <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <div class="success-box">
                <p style="font-size: 18px; font-weight: bold; margin: 0;">✅ You've Been Shortlisted!</p>
            </div>
            
            <p>We are pleased to inform you that after reviewing your interview performance for the <span class="highlight">${jobTitle}</span> position, you have been shortlisted for the next round!</p>
            
            ${recruiterMessage ? `
            <div class="message-box">
                <p style="margin: 0;"><strong>Message from our team:</strong></p>
                <p style="margin-top: 10px;">"${recruiterMessage}"</p>
            </div>
            ` : ''}
            
            <div class="next-steps">
                <p><strong>📋 What's Next?</strong></p>
                <ul>
                    <li>Our HR team will contact you within 2-3 business days</li>
                    <li>We'll schedule a follow-up interview or discussion</li>
                    <li>Please keep your contact information up to date</li>
                    <li>Prepare any questions you may have about the role</li>
                </ul>
            </div>
            
            <p>Your skills and experience have impressed our team, and we're excited to move forward with you in the hiring process.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The Hirely Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. For inquiries, please contact our HR team.</p>
            <p style="margin-top: 5px; font-size: 12px;">© ${new Date().getFullYear()} Hirely. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await sendEmail({
            to: candidateEmail,
            subject: `Great News! You've Been Shortlisted - ${jobTitle}`,
            htmlContent: emailContent,
        });
        console.log(`[Email] Shortlist notification sent to ${candidateEmail}`);
        return true;
    } catch (error) {
        console.error('[Email] Error sending shortlist email:', error);
        return false;
    }
}

export async function sendRejectionEmail(
    candidateName: string,
    candidateEmail: string,
    jobTitle: string,
    recruiterMessage?: string
) {
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 0; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #ffffff; padding: 40px 30px; }
        .content p { margin: 15px 0; }
        .highlight { background: #6366f1; color: white; padding: 4px 12px; border-radius: 6px; font-weight: bold; }
        .message-box { background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic; color: #3730a3; }
        .encouragement { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .encouragement p { margin: 8px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e5e7eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Interview Update</h1>
        </div>
        <div class="content">
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>Thank you for taking the time to interview for the <span class="highlight">${jobTitle}</span> position with us. We truly appreciate your interest in joining our team.</p>
            
            <p>After careful consideration of all candidates, we have decided to move forward with other applicants whose qualifications more closely match our current needs.</p>
            
            ${recruiterMessage ? `
            <div class="message-box">
                <p style="margin: 0;"><strong>Feedback from our team:</strong></p>
                <p style="margin-top: 10px;">"${recruiterMessage}"</p>
            </div>
            ` : ''}
            
            <div class="encouragement">
                <p><strong>💪 Keep Going!</strong></p>
                <p>This decision does not diminish your skills or potential. We encourage you to:</p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Continue building your experience and skills</li>
                    <li>Apply for other positions that match your expertise</li>
                    <li>Keep an eye on our career page for future opportunities</li>
                </ul>
            </div>
            
            <p>We were impressed by your qualifications and wish you the very best in your job search and future professional endeavors.</p>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>The Hirely Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Thank you for your interest in Hirely.</p>
            <p style="margin-top: 5px; font-size: 12px;">© ${new Date().getFullYear()} Hirely. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await sendEmail({
            to: candidateEmail,
            subject: `Interview Update - ${jobTitle}`,
            htmlContent: emailContent,
        });
        console.log(`[Email] Rejection notification sent to ${candidateEmail}`);
        return true;
    } catch (error) {
        console.error('[Email] Error sending rejection email:', error);
        return false;
    }
}
