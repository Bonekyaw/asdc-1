import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import prisma from "@/lib/prisma";

async function sendVerificationEmail({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  const subject = "Your Diving Admin verification code";
  const previewText =
    "Use this one-time code to securely access Diving Admin.";
  const text = [
    "Diving Admin verification",
    "",
    `Your login code is ${otp}.`,
    "This code expires in 5 minutes. If you did not request it, you can ignore this email.",
  ].join("\n");
  const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;background:#f4f7fb;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${previewText}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;overflow:hidden;border-radius:18px;background:#ffffff;border:1px solid #dce6f2;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:#0f172a;padding:30px 32px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:#5eead4;">
                  Diving Admin
                </div>
                <h1 style="margin:18px 0 0;font-size:28px;line-height:1.2;font-weight:700;color:#ffffff;">
                  Verify your email to continue
                </h1>
                <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#cbd5e1;">
                  Enter this one-time code in the admin dashboard to finish signing in.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 32px 30px;">
                <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#334155;">
                  Your verification code
                </p>
                <div style="border-radius:14px;background:#ecfeff;border:1px solid #99f6e4;padding:22px;text-align:center;">
                  <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:38px;line-height:1;font-weight:800;letter-spacing:10px;color:#0f766e;">
                    ${otp}
                  </div>
                </div>
                <p style="margin:22px 0 0;font-size:14px;line-height:1.7;color:#475569;">
                  This code expires in <strong style="color:#0f172a;">5 minutes</strong>. Keep it private and do not share it with anyone.
                </p>
                <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:20px;">
                  <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">
                    If you did not request this code, no action is needed. Your account remains protected.
                  </p>
                </div>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">
            Sent for ${email}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  if (resendApiKey && from) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send ${type} OTP email.`);
    }

    return;
  }

  console.info(`[auth] ${type} OTP for ${email}: ${otp}`);
}

async function isVerifiedAdminEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
    select: {
      emailVerified: true,
      role: true,
    },
  });

  return Boolean(user?.emailVerified && user.role === "ADMIN");
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    emailOTP({
      disableSignUp: true,
      expiresIn: 300,
      allowedAttempts: 3,
      async sendVerificationOTP({ email, otp, type }) {
        if (!(await isVerifiedAdminEmail(email))) {
          throw new Error("Email is not authorized for admin access.");
        }

        await sendVerificationEmail({ email, otp, type });
      },
    }),
  ],
});
