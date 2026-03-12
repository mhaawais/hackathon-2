import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In — TodoMate",
  description: "Sign in to your TodoMate account.",
};

export default function SignInPage() {
  return <SignInForm />;
}
