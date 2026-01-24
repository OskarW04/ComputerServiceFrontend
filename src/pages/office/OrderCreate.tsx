import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/data/api";
import type { Client } from "@/data/schema";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function OrderCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: searchParams.get("clientId") || "",
    deviceDescription: "",
    problemDescription: "",
  });

  useEffect(() => {
    const fetchClients = async () => {
      const data = await api.clients.getAll();
      setClients(data);
    };
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderData = {
        ...formData,
        orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      };
      await api.orders.create(orderData);
      toast.success("Zlecenie utworzone pomyślnie!");
      navigate("/office/orders");
    } catch (error) {
      console.error("Error creating order", error);
      toast.error("Błąd tworzenia zlecenia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Nowe Zlecenie Naprawy</CardTitle>
          <CardDescription>Wypełnij szczegóły zlecenia.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="client">Klient</Label>
              <Select
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz klienta" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} ({client.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="device">Urządzenie</Label>
              <Input
                id="device"
                placeholder="np. Laptop Dell XPS 15"
                value={formData.deviceDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deviceDescription: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="problem">Opis Problemu</Label>
              <Textarea
                id="problem"
                placeholder="Opisz usterkę..."
                className="min-h-[100px]"
                value={formData.problemDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    problemDescription: e.target.value,
                  })
                }
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Tworzenie zlecenia..." : "Utwórz Zlecenie"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
