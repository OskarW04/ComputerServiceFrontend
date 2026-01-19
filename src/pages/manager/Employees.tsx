import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/data/api";
import type { Employee, EmployeeRole, SkillLevel } from "@/data/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useErrorDialog } from "@/context/GlobalErrorDialogContext";

export default function ManagerEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { showError } = useErrorDialog();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "", // Added password field
    role: "TECHNICIAN" as EmployeeRole,
    skillLevel: "MID" as SkillLevel,
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await api.employees.getAll();
      setEmployees(data);
    } catch (error) {
      console.error("Failed to fetch employees", error);
      showError("Błąd", "Nie udało się pobrać listy pracowników.");
    }
  }, [showError]);

  useEffect(() => {
    (async () => {
      await fetchEmployees();
    })();
  }, [fetchEmployees]);

  const handleAddEmployee = async () => {
    try {
      if (!formData.password) {
        toast.error("Hasło jest wymagane dla nowego pracownika.");
        return;
      }
      await api.employees.create({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        skillLevel: formData.skillLevel || undefined,
      });
      await fetchEmployees();
      setAddOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "TECHNICIAN",
        skillLevel: "MID",
      });
      toast.success("Pracownik dodany pomyślnie.");
    } catch (error) {
      console.error(error);
      showError("Błąd", "Nie udało się dodać pracownika.");
    }
  };

  const handleEdit = async () => {
    if (!editingEmployee) return;
    try {
      await api.employees.update(editingEmployee.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        // Only send password if provided (non-empty)
        password: formData.password ? formData.password : undefined,
        role: formData.role,
        skillLevel:
          formData.role === "TECHNICIAN" ? formData.skillLevel : undefined,
      });
      await fetchEmployees();
      setEditOpen(false);
      setEditingEmployee(null);
      toast.success("Dane pracownika zaktualizowane.");
    } catch (error) {
      console.error(error);
      showError("Błąd", "Nie udało się zaktualizować danych pracownika.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć tego pracownika?")) {
      try {
        await api.employees.delete(id);
        await fetchEmployees();
        toast.success("Pracownik usunięty.");
      } catch (error) {
        console.error(error);
        showError("Błąd", "Nie udało się usunąć pracownika.");
      }
    }
  };

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      password: "", // Reset password field for edit
      role: employee.role,
      skillLevel: employee.skillLevel || "MID",
    });
    setEditOpen(true);
  };

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "lastName",
      header: "Nazwisko",
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Rola",
      cell: ({ row }) => <Badge>{row.original.role}</Badge>,
    },
    {
      accessorKey: "skillLevel",
      header: "Poziom",
      cell: ({ row }) => row.original.skillLevel || "-",
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
            onClick={() => handleDelete(row.original.id)}
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
        <h2 className="text-3xl font-bold tracking-tight">Pracownicy</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>Dodaj Pracownika</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj Nowego Pracownika</DialogTitle>
              <DialogDescription>
                Dodaj nowego pracownika do systemu.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">Imię</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Nazwisko</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="jan.kowalski@service.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Hasło</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Hasło..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Rola</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as EmployeeRole,
                    })
                  }
                >
                  <option value="OFFICE">Biuro</option>
                  <option value="TECHNICIAN">Technik</option>
                  <option value="WAREHOUSE">Magazyn</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
              {formData.role === "TECHNICIAN" && (
                <div className="grid gap-2">
                  <Label htmlFor="skillLevel">Poziom Umiejętności</Label>
                  <select
                    id="skillLevel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.skillLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        skillLevel: e.target.value as SkillLevel,
                      })
                    }
                  >
                    <option value="">Wybierz...</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="MID">Mid</option>
                    <option value="SENIOR">Senior</option>
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Anuluj
              </Button>
              <Button onClick={handleAddEmployee}>Dodaj Pracownika</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Pracowników</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={employees}
            searchKey="lastName"
            searchPlaceholder="Szukaj pracownika..."
          />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj Pracownika</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Imię</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Nazwisko</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Hasło (pozostaw puste aby nie zmieniać)</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Nowe hasło..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rola</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData({ ...formData, role: v as EmployeeRole })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICE">Biuro</SelectItem>
                    <SelectItem value="TECHNICIAN">Technik</SelectItem>
                    <SelectItem value="WAREHOUSE">Magazyn</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.role === "TECHNICIAN" && (
                <div className="space-y-2">
                  <Label>Poziom</Label>
                  <Select
                    value={formData.skillLevel}
                    onValueChange={(v) =>
                      setFormData({ ...formData, skillLevel: v as SkillLevel })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JUNIOR">Junior</SelectItem>
                      <SelectItem value="MID">Mid</SelectItem>
                      <SelectItem value="SENIOR">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Zapisz Zmiany</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
