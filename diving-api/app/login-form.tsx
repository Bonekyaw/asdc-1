"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { authClient, signOut, useSession } from "@/lib/auth-client";

type LoginStep = "email" | "otp";

const emailFormSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your admin email address.")
    .email("Enter a valid email address."),
});

const otpFormSchema = emailFormSchema.extend({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});

type EmailFormInput = z.input<typeof emailFormSchema>;
type EmailFormValues = z.output<typeof emailFormSchema>;
type OtpFormInput = z.input<typeof otpFormSchema>;
type OtpFormValues = z.output<typeof otpFormSchema>;

function normalizeOtp(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function getErrorMessage(error: { message?: string } | null | undefined) {
  return error?.message || "Something went wrong. Please try again.";
}

export function LoginForm() {
  const { data: session, isPending } = useSession();
  const [step, setStep] = useState<LoginStep>("email");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const emailForm = useForm<EmailFormInput, unknown, EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: "",
    },
  });
  const otpForm = useForm<OtpFormInput, unknown, OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  const isSubmitting =
    emailForm.formState.isSubmitting || otpForm.formState.isSubmitting;
  const emailError = emailForm.formState.errors.email?.message;
  const otpError = otpForm.formState.errors.otp?.message;

  const requestOtp: SubmitHandler<EmailFormValues> = async (data) => {
    setFormError("");
    setMessage("");

    try {
      const { error: otpError } = await authClient.emailOtp.sendVerificationOtp(
        {
          email: data.email,
          type: "sign-in",
        },
      );

      if (otpError) {
        setFormError(getErrorMessage(otpError));
        return;
      }

      setStep("otp");
      emailForm.setValue("email", data.email);
      otpForm.reset({
        email: data.email,
        otp: "",
      });
      setMessage(`We sent a 6-digit code to ${data.email}.`);
    } catch {
      setFormError("Unable to send the login code right now.");
    }
  };

  const verifyOtp: SubmitHandler<OtpFormValues> = async (data) => {
    setFormError("");
    setMessage("");

    try {
      const { error: signInError } = await authClient.signIn.emailOtp({
        email: data.email,
        otp: data.otp,
      });

      if (signInError) {
        setFormError(getErrorMessage(signInError));
        return;
      }

      setShowLogin(false);
      setMessage("Signed in successfully.");
    } catch {
      setFormError("Unable to verify the code right now.");
    }
  };

  async function handleSignOut() {
    setShowLogin(true);
    setStep("email");
    emailForm.reset({ email: "" });
    otpForm.reset({ email: "", otp: "" });
    setFormError("");
    setMessage("");
    await signOut();
  }

  if (!showLogin && !isPending && session?.user) {
    return (
      <main className="min-h-dvh bg-[#f6f7fb] px-6 py-8 text-slate-950">
        <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-5xl flex-col justify-between">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-700">
                Diving Admin
              </p>
              <h1 className="mt-2 text-2xl font-semibold">Dashboard access</h1>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white"
            >
              Sign out
            </button>
          </header>

          <div className="grid gap-6 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-end">
            <div>
              <p className="text-sm font-medium text-teal-700">
                Authenticated session
              </p>
              <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Welcome back to the admin dashboard.
              </h2>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="mt-2 break-all text-base font-medium text-slate-950">
                {session.user.email}
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f6f7fb] text-slate-950">
      <section className="grid min-h-dvh lg:grid-cols-[1fr_480px]">
        <div className="flex min-h-[42dvh] flex-col justify-between bg-slate-950 px-6 py-8 text-white sm:px-10 lg:min-h-dvh">
          <header>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-300">
              Diving Admin
            </p>
          </header>
          <div className="max-w-2xl py-14">
            <p className="text-sm font-medium text-teal-300">Secure access</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Sign in to manage the diving game dashboard.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Use your admin email to receive a one-time verification code.
            </p>
          </div>
          <p className="text-sm text-slate-400">Email OTP verification</p>
        </div>

        <div className="flex items-center px-6 py-10 sm:px-10">
          <div className="w-full">
            <div className="mb-8 flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  step === "email" ? "bg-teal-600" : "bg-slate-300"
                }`}
              />
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  step === "otp" ? "bg-teal-600" : "bg-slate-300"
                }`}
              />
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium text-teal-700">
                {step === "email" ? "Step 1" : "Step 2"}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {step === "email" ? "Enter email" : "Verify email OTP"}
              </h2>
            </div>

            {step === "email" ? (
              <form
                onSubmit={emailForm.handleSubmit(requestOtp)}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(emailError)}
                    placeholder="admin@example.com"
                    {...emailForm.register("email")}
                    className="mt-2 h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  />
                  {emailError ? (
                    <p className="mt-2 text-sm text-red-700">{emailError}</p>
                  ) : null}
                </div>

                {formError ? (
                  <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? "Sending code..." : "Continue"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={otpForm.handleSubmit(verifyOtp)}
                className="space-y-5"
              >
                <input type="hidden" {...otpForm.register("email")} />
                <div>
                  <label
                    htmlFor="otp"
                    className="text-sm font-medium text-slate-700"
                  >
                    Verification code
                  </label>
                  <input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-invalid={Boolean(otpError)}
                    placeholder="000000"
                    {...otpForm.register("otp", {
                      onChange: (event) => {
                        event.target.value = normalizeOtp(event.target.value);
                      },
                    })}
                    className="mt-2 h-14 w-full rounded-md border border-slate-300 bg-white px-4 text-center font-mono text-2xl tracking-[0.3em] text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
                  />
                  {otpError ? (
                    <p className="mt-2 text-sm text-red-700">{otpError}</p>
                  ) : null}
                </div>

                {message ? (
                  <p className="rounded-md bg-teal-50 px-4 py-3 text-sm text-teal-800">
                    {message}
                  </p>
                ) : null}

                {formError ? (
                  <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-md bg-teal-600 px-5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSubmitting ? "Verifying..." : "Verify and sign in"}
                </button>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      otpForm.reset({ email: "", otp: "" });
                      setFormError("");
                      setMessage("");
                    }}
                    className="font-medium text-slate-600 transition hover:text-slate-950"
                  >
                    Change email
                  </button>
                  <button
                    type="button"
                    onClick={() => void emailForm.handleSubmit(requestOtp)()}
                    disabled={isSubmitting}
                    className="font-medium text-teal-700 transition hover:text-teal-900 disabled:text-slate-400"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
