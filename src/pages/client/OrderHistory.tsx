import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/data/api";
import type { RepairOrder } from "@/data/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export default function ClientOrderHistory() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const data = await api.orders.getAll();
      // Filter for completed/cancelled orders
      const historyOrders = data.filter((o) =>
        ["COMPLETED", "CANCELLED"].includes(o.status),
      );
      setOrders(historyOrders);
    };
    fetchOrders();
  }, []);

  const columns: ColumnDef<RepairOrder>[] = [
    {
      accessorKey: "orderNumber",
      header: "Numer Zlecenia",
    },
    {
      accessorKey: "createdAt",
      header: "Data",
      cell: ({ row }) =>
        format(new Date(row.getValue("createdAt")), "yyyy-MM-dd"),
    },
    {
      accessorKey: "deviceDescription",
      header: "Urządzenie",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return <Badge variant="outline">{status}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/client/orders/${row.original.id}`)}
          >
            Szczegóły
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Historia Zleceń</h2>

      <Card>
        <CardHeader>
          <CardTitle>Zakończone Zlecenia</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            searchKey="orderNumber"
            searchPlaceholder="Szukaj po numerze..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
