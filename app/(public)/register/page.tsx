import { AuthShell } from "@/components/auth/AuthShell";
import { RegistrationForm } from "@/components/auth/RegistrationForm";

export default function RegisterPage() {
  return (
    <AuthShell>
      <RegistrationForm />
    </AuthShell>
  );
}
