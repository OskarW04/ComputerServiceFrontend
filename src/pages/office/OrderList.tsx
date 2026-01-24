import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/data/api";
import type { RepairOrder, Client } from "@/data/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { formatStatus } from "@/lib/utils";

type OrderWithClient = RepairOrder & { clientName: string };

export default function OfficeOrderList() {
  const [orders, setOrders] = useState<OrderWithClient[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [ordersData, clientsData] = await Promise.all([
        api.orders.getAll(),
        api.clients.getAll(),
      ]);

      const enrichedOrders = ordersData.map((order: RepairOrder) => {
        const client = clientsData.find((c: Client) => c.id === order.clientId);
        return {
          ...order,
          clientName: client
            ? `${client.firstName} ${client.lastName}`
            : "Nieznany",
        };
      });

      setOrders(enrichedOrders);
    };
    fetchData();
  }, []);

  const columns: ColumnDef<OrderWithClient>[] = [
    {
      accessorKey: "orderNumber",
      header: "Numer Zlecenia",
    },
    {
      accessorKey: "clientName",
      header: "Klient",
    },
    {
      accessorKey: "createdAt",
      header: "Data Utworzenia",
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
        return (
          <Badge variant={status === "NEW" ? "destructive" : "outline"}>
            {formatStatus(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assignedTechnicianId",
      header: "Technik",
      cell: ({ row }) => row.original.assignedTechnicianId || "Nieprzypisany",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/office/orders/${row.original.id}`)}
          >
            Szczegóły
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Lista Zleceń</h2>
        <Button onClick={() => navigate("/office/new-order")}>
          Nowe Zlecenie
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wszystkie Zlecenia</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            searchKey="clientName"
            searchPlaceholder="Szukaj po nazwisku klienta..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
