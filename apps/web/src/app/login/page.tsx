"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    try {
      await authClient.login(String(formData.get("email")), String(formData.get("password")));
      toast.success("Sesión iniciada.");
      router.push("/admin");
    } catch {
      toast.error("Credenciales no válidas o API no disponible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LockKeyhole />
            Admin login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue="abel.valle.rosa@gmail.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button disabled={loading} type="submit">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
