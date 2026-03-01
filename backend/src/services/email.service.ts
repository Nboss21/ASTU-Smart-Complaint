import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT ? Number(SMTP_PORT) : 587,
  secure: false,
  auth:
    SMTP_USER && SMTP_PASS
      ? {
          user: SMTP_USER,
          pass: SMTP_PASS,
        }
      : undefined,
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) return;

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (err) {
    // best-effort: log and continue
    // eslint-disable-next-line no-console
    console.error("Failed to send email", err);
  }
}

export async function sendComplaintCreatedEmail(
  userEmail: string,
  complaintTitle: string,
) {
  await sendEmail(
    userEmail,
    "Your complaint has been received",
    `
      <p>Dear student,</p>
      <p>Your complaint "<strong>${complaintTitle}</strong>" has been received by the ASTU Smart Complaint System.</p>
      <p>You can track its status at any time from your dashboard.</p>
      <p>Best regards,<br/>ASTU Support</p>
    `,
  );
}

export async function sendComplaintStatusChangedEmail(
  userEmail: string,
  complaintTitle: string,
  newStatus: string,
) {
  await sendEmail(
    userEmail,
    "Update on your complaint",
    `
      <p>Dear student,</p>
      <p>The status of your complaint "<strong>${complaintTitle}</strong>" has been updated to <strong>${newStatus}</strong>.</p>
      <p>Please check your complaint details for more information.</p>
      <p>Best regards,<br/>ASTU Support</p>
    `,
  );
}
