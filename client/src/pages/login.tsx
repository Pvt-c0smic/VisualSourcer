import { LoginForm } from "@/components/auth/login-form";

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-lightest dark:bg-neutral-darkest p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-neutral-darkest dark:text-white">
            TrainNET
          </h1>
          <p className="mt-2 text-sm text-neutral-dark dark:text-neutral-light">
            Learning Management System for Military Personnel
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
