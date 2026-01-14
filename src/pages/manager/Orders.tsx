import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { api } from '@/data/api';
import type { RepairOrder, Employee } from '@/data/schema';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function ManagerOrders() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [technicians, setTechnicians] = useState<Employee[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [selectedTech, setSelectedTech] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const o = await api.orders.getAll();
      setOrders(o);
      const e = await api.employees.getAll();
      setTechnicians(e.filter(emp => emp.role === 'TECHNICIAN'));
    };
    fetchData();
  }, []);

  const handleAssign = async () => {
      if (!selectedOrder || !selectedTech) return;
      await api.orders.assignTechnician(selectedOrder.id, selectedTech);
      await api.orders.updateStatus(selectedOrder.id, 'WAITING_FOR_TECHNICIAN');
      const updatedOrders = await api.orders.getAll();
      setOrders(updatedOrders);
      setAssignOpen(false);
      alert('Technik przypisany.');
  };

  const openAssign = (order: RepairOrder) => {
      setSelectedOrder(order);
      setSelectedTech(order.assignedTechnicianId || '');
      setAssignOpen(true);
  };

  const handleArchive = async (id: string) => {
      if (confirm('Czy na pewno zarchiwizować to zlecenie?')) {
          // Mock archive - in real app update status or move to archive table
          await api.orders.updateStatus(id, 'CANCELLED'); // Using CANCELLED as proxy for now or add ARCHIVED status
          const updatedOrders = await api.orders.getAll();
          setOrders(updatedOrders);
          alert('Zlecenie zarchiwizowane.');
      }
  };

  const columns: ColumnDef<RepairOrder>[] = [
    {
      accessorKey: "orderNumber",
      header: "Numer Zlecenia",
    },
    {
      accessorKey: "deviceDescription",
      header: "Urządzenie",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge>{row.original.status}</Badge>
    },
    {
      accessorKey: "assignedTechnicianId",
      header: "Technik",
      cell: ({ row }) => {
          const tech = technicians.find(t => t.id === row.original.assignedTechnicianId);
          return tech ? `${tech.firstName} ${tech.lastName}` : <span className="text-muted-foreground">Nieprzypisany</span>
      }
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openAssign(row.original)}>Przypisz</Button>
                <Button variant="ghost" size="sm" onClick={() => handleArchive(row.original.id)}>Archiwizuj</Button>
            </div>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Zarządzanie Zleceniami</h2>
      <DataTable columns={columns} data={orders} />

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Przypisz Technika</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label>Wybierz Technika</Label>
                    <Select value={selectedTech} onValueChange={setSelectedTech}>
                        <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                        <SelectContent>
                            {technicians.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.skillLevel})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleAssign}>Zapisz</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
