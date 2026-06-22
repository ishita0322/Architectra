import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../lib/api";
import { AuthShell, Field, buttonCls, inputCls } from "./Login";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await registerUser(values.email, values.password);
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Something went wrong",
      );
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Start designing systems with AI">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            className={inputCls}
            {...register("email")}
          />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="new-password"
            className={inputCls}
            {...register("password")}
          />
        </Field>
        <Field label="Confirm password" error={errors.confirm?.message}>
          <input
            type="password"
            autoComplete="new-password"
            className={inputCls}
            {...register("confirm")}
          />
        </Field>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <button type="submit" disabled={isSubmitting} className={buttonCls}>
          {isSubmitting ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-slate-900 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
