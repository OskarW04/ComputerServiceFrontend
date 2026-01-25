import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useErrorDialog } from "@/context/GlobalErrorDialogContext";
import { api } from "@/data/api";
import { toast } from "sonner";

export default function Login() {
  const { loginEmployee, loginClient } = useAuth();
  const navigate = useNavigate();
  const { showError } = useErrorDialog();
  const [loading, setLoading] = useState(false);

  // Employee Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Client Login State
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pinSent, setPinSent] = useState(false);

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginEmployee(email, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed", error);
      showError(
        "Błąd Logowania",
        "Logowanie nieudane. Sprawdź e-mail i hasło.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginClient(phone, pin);
      navigate("/client/dashboard");
    } catch (error) {
      console.error("Login failed", error);
      showError(
        "Błąd Logowania",
        "Logowanie nieudane. Sprawdź numer telefonu i PIN.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendPin = async () => {
    if (!phone) {
      toast.error("Wprowadź numer telefonu");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.generatePIN(phone);
      toast.info(`Twój PIN to: ${res.pin}`);
      setPinSent(true);
    } catch (error) {
      console.error("Error sending PIN", error);
      toast.error("Błąd wysyłania PIN-u.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Portal Serwisu Komputerowego</CardTitle>
          <CardDescription>Zaloguj się, aby kontynuować</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="employee">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="employee">Pracownik</TabsTrigger>
              <TabsTrigger value="client">Klient</TabsTrigger>
            </TabsList>

            <TabsContent value="employee">
              <form onSubmit={handleEmployeeLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jan@serwis.pl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Hasło</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logowanie..." : "Zaloguj jako Pracownik"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="client">
              <form onSubmit={handleClientLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Numer Telefonu</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleSendPin}
                      disabled={loading}
                    >
                      {pinSent ? "Wyślij ponownie" : "Wyślij PIN"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">Kod PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="****"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    disabled={!pinSent}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !pinSent}
                >
                  {loading ? "Logowanie..." : "Zaloguj jako Klient"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
