import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "@/data/api";
import type { Client } from "@/data/schema";
import { useNavigate } from "react-router-dom";

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const data = await api.clients.getAll();
      setClients(data);
    };
    fetchClients();
  }, []);

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "firstName",
      header: "Imię",
    },
    {
      accessorKey: "lastName",
      header: "Nazwisko",
    },
    {
      accessorKey: "phone",
      header: "Telefon",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            navigate(`/office/new-order?clientId=${row.original.id}`)
          }
        >
          Nowe Zlecenie
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Klienci</h2>
        <Button onClick={() => navigate("/office/register-client")}>
          Zarejestruj Klienta
        </Button>
      </div>
      <DataTable columns={columns} data={clients} />
    </div>
  );
}
