import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { api } from "@/data/api";
import type { ServiceAction } from "@/data/schema";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function ManagerServices() {
  const [services, setServices] = useState<ServiceAction[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceAction | null>(
    null,
  );
  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceAction | null>(
    null,
  );

  const [formData, setFormData] = useState({
    name: "",
    price: "",
  });

  useEffect(() => {
    const fetchServices = async () => {
      const data = await api.services.getAll();
      setServices(data);
    };
    fetchServices();
  }, []);

  const handleAdd = async () => {
    await api.services.create({
      name: formData.name,
      price: parseFloat(formData.price),
    });
    const data = await api.services.getAll();
    setServices(data);
    setAddOpen(false);
    setFormData({ name: "", price: "" });
    toast.success("Usługa dodana.");
  };

  const handleEdit = async () => {
    if (!editingService) return;
    await api.services.update(editingService.id, {
      name: formData.name,
      price: parseFloat(formData.price),
    });
    const data = await api.services.getAll();
    setServices(data);
    setEditOpen(false);
    setEditingService(null);
    toast.success("Usługa zaktualizowana.");
  };

  const handleConfirmDelete = async () => {
    if (serviceToDelete) {
      await api.services.delete(serviceToDelete.id);
      toast.success("Usługa usunięta.");
      const data = await api.services.getAll();
      setServices(data);
      setDeleteOpen(false);
      setServiceToDelete(null);
    }
  };

  const openDelete = (service: ServiceAction) => {
    setServiceToDelete(service);
    setDeleteOpen(true);
  };

  const openEdit = (service: ServiceAction) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price.toString(),
    });
    setEditOpen(true);
  };

  const columns: ColumnDef<ServiceAction>[] = [
    {
      accessorKey: "name",
      header: "Nazwa Usługi",
    },
    {
      accessorKey: "price",
      header: "Cena (PLN)",
      cell: ({ row }) => `${row.original.price.toFixed(2)} PLN`,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openEdit(row.original)}
          >
            Edytuj
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => openDelete(row.original)}
          >
            Usuń
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Katalog Usług</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>Dodaj Usługę</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nowa Usługa</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nazwa</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cena (PLN)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd}>Dodaj</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={services} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj Usługę</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nazwa</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cena (PLN)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Zapisz Zmiany</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
