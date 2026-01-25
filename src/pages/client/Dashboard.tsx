import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/data/api";
import type { RepairOrder } from "@/data/schema";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { formatStatus } from "@/lib/utils";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState<RepairOrder[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const data = await api.client.getOrders();
      setActiveOrders(
        data.filter(
          (o: RepairOrder) =>
            o.status !== "COMPLETED" && o.status !== "CANCELLED",
        ),
      );
    };
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">
        Witaj, {user && "firstName" in user ? user.firstName : "Kliencie"}
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktywne Zlecenia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-semibold mt-6">Twoje Aktywne Zlecenia</h3>
      <div className="grid gap-4">
        {activeOrders.map((order) => (
          <Card
            key={order.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => navigate(`/client/orders/${order.id}`)}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Zlecenie #{order.orderNumber}</CardTitle>
                <Badge>{formatStatus(order.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {order.deviceDescription}
              </p>
              <p className="text-sm mt-2">
                Data utworzenia:{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
        {activeOrders.length === 0 && (
          <p className="text-muted-foreground">Brak aktywnych zleceń.</p>
        )}
      </div>
    </div>
  );
}
