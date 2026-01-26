import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/data/api";
import type { RepairOrder } from "@/data/schema";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatStatus } from "@/lib/utils";

export default function TechDashboard() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState<RepairOrder[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      if (user && "role" in user) {
        const data = await api.tech.getAssignedOrders();
        setMyTasks(data);
      }
    };
    fetchTasks();
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Pulpit Technika</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Przypisane Zadania
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-semibold mt-6">Twoje Zadania</h3>
      <div className="grid gap-4">
        {myTasks
          .filter((o) => o.status !== "COMPLETED")
          .map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Zlecenie #{order.orderNumber}</CardTitle>
                  <Badge>{formatStatus(order.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.deviceDescription}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.problemDescription}
                </p>
                <div className="mt-4">
                  <Button onClick={() => navigate(`/tech/tasks/${order.id}`)}>
                    Otwórz Zlecenie
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        {myTasks.filter((o) => o.status !== "COMPLETED").length === 0 && (
          <p className="text-muted-foreground">
            Brak przypisanych aktywnych zadań.
          </p>
        )}
      </div>
      <h3 className="text-xl font-semibold mt-6">Zakończone Zadania</h3>
      <div className="grid gap-4">
        {myTasks
          .filter((o) => o.status === "COMPLETED")
          .map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Zlecenie #{order.orderNumber}</CardTitle>
                  <Badge>{formatStatus(order.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.deviceDescription}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.problemDescription}
                </p>
                <div className="mt-4">
                  <Button onClick={() => navigate(`/tech/tasks/${order.id}`)}>
                    Otwórz Zlecenie
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        {myTasks.filter((o) => o.status === "COMPLETED").length === 0 && (
          <p className="text-muted-foreground">Brak zakończonych zadań.</p>
        )}
      </div>
    </div>
  );
}
