import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/data/api";
import type { RepairOrder, Client, Employee } from "@/data/schema";
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
      const [ordersData, employeesData, clientsData] = (await Promise.all([
        api.orders.getAll(),
        api.employees.getAll(),
        api.clients.getAll(),
      ])) as [RepairOrder[], Employee[], Client[]];

      const enrichedOrders = ordersData.map((order: RepairOrder) => {
        // Resolve Technician Name
        let technicianName = order.technicianName;
        if (!technicianName && order.assignedTechnician) {
          technicianName = `${order.assignedTechnician.firstName} ${order.assignedTechnician.lastName}`;
        }
        if (!technicianName && order.assignedTechnicianId) {
          const tech = employeesData.find(
            (e) => e.id === order.assignedTechnicianId,
          );
          if (tech) {
            technicianName = `${tech.firstName} ${tech.lastName}`;
          }
        }

        // Resolve Client Name
        let clientName = order.clientName;
        if (!clientName && order.clientId) {
          const client = clientsData.find((c) => c.id === order.clientId);
          if (client) {
            clientName = `${client.firstName} ${client.lastName}`;
          }
        }

        return {
          ...order,
          clientName: clientName || "Nieznany",
          technicianName: technicianName, // Let the column cell handle the fallback to "Nieprzypisany" or handle it here
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
      accessorKey: "technicianName",
      header: "Technik",
      cell: ({ row }) => row.original.technicianName || "Nieprzypisany",
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
