import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Inscription — M&A OS",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
