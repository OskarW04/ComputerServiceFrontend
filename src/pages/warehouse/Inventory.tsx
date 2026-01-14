import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { api } from "@/data/api";
import type { SparePart, PartOrder } from "@/data/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function WarehouseInventory() {
  const navigate = useNavigate();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [orders, setOrders] = useState<PartOrder[]>([]);
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [orderPartsOpen, setOrderPartsOpen] = useState(false);
  const [releasePartOpen, setReleasePartOpen] = useState(false);

  // Release Part State
  const [releaseData, setReleaseData] = useState({ partId: "", quantity: "1" });

  // Add Part Form State
  const [newPart, setNewPart] = useState({
    name: "",
    category: "",
    quantity: "",
    minQuantity: "",
    price: "",
  });

  // Order Parts Form State
  const [newOrder, setNewOrder] = useState({
    sparePartId: "",
    quantity: "",
    estimatedDelivery: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const partsData = await api.parts.getAll();
      setParts(partsData);
      // Mock fetch orders
      setOrders([]);
    };
    fetchData();
  }, []);

  const handleAddPart = async () => {
    // Mock adding part
    const part: SparePart = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPart.name,
      category: newPart.category,
      quantity: parseInt(newPart.quantity),
      minQuantity: parseInt(newPart.minQuantity),
      price: parseFloat(newPart.price),
    };
    setParts([...parts, part]);
    setAddPartOpen(false);
    setNewPart({
      name: "",
      category: "",
      quantity: "",
      minQuantity: "",
      price: "",
    });
    alert("Część dodana pomyślnie!");
  };

  const handleOrderParts = async () => {
    // Mock ordering parts
    const order: PartOrder = {
      id: Math.random().toString(36).substr(2, 9),
      sparePartId: newOrder.sparePartId,
      orderDate: new Date().toISOString(),
      estimatedDelivery: newOrder.estimatedDelivery,
      status: "ORDERED",
      quantity: parseInt(newOrder.quantity),
    };
    setOrders([...orders, order]);
    setOrderPartsOpen(false);
    setNewOrder({ sparePartId: "", quantity: "", estimatedDelivery: "" });
    alert("Zamówienie złożone pomyślnie!");
  };

  const handleReleasePart = async () => {
    const part = parts.find((p) => p.id === releaseData.partId);
    if (!part) return;
    const qty = parseInt(releaseData.quantity);
    if (part.quantity < qty) {
      alert("Brak wystarczającej ilości na stanie!");
      return;
    }
    // Update part quantity (mock)
    // In real app we'd call api.parts.update or api.parts.release
    // We'll mock update locally and assume API call
    const updatedPart = { ...part, quantity: part.quantity - qty };
    setParts(parts.map((p) => (p.id === part.id ? updatedPart : p)));
    setReleasePartOpen(false);
    alert(`Wydano ${qty} szt. ${part.name}`);
  };

  const handleReceiveDelivery = async (orderId: string) => {
    await api.partOrders.updateStatus(orderId, "DELIVERED");
    // Refresh orders and parts
    const updatedOrders = await api.partOrders.getAll();
    setOrders(updatedOrders);
    const updatedParts = await api.parts.getAll();
    setParts(updatedParts);
    alert("Dostawa przyjęta. Stan magazynowy zaktualizowany.");
  };

  const partColumns: ColumnDef<SparePart>[] = [
    {
      accessorKey: "name",
      header: "Nazwa Części",
    },
    {
      accessorKey: "category",
      header: "Kategoria",
    },
    {
      accessorKey: "quantity",
      header: "Ilość",
    },
    {
      accessorKey: "price",
      header: "Cena",
      cell: ({ row }) => `${row.original.price.toFixed(2)} PLN`,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const part = row.original;
        const isLowStock = part.quantity < part.minQuantity;
        return (
          <Badge variant={isLowStock ? "destructive" : "outline"}>
            {isLowStock ? "Niski Stan" : "Dostępny"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setReleaseData({ partId: row.original.id, quantity: "1" });
            setReleasePartOpen(true);
          }}
        >
          Wydaj
        </Button>
      ),
    },
  ];

  const orderColumns: ColumnDef<PartOrder>[] = [
    {
      accessorKey: "id",
      header: "ID Zamówienia",
    },
    {
      accessorKey: "sparePartId",
      header: "ID Części",
    },
    {
      accessorKey: "quantity",
      header: "Ilość",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        if (
          row.original.status === "ORDERED" ||
          row.original.status === "IN_DELIVERY"
        ) {
          return (
            <Button
              size="sm"
              onClick={() => handleReceiveDelivery(row.original.id)}
            >
              Przyjmij
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Magazyn</h2>
        <div className="space-x-2">
          <Button
            variant="secondary"
            onClick={() => navigate("/warehouse/delivery")}
          >
            Przyjmij Dostawę
          </Button>
          <Dialog open={orderPartsOpen} onOpenChange={setOrderPartsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Zamów Części</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Zamów Części</DialogTitle>
                <DialogDescription>
                  Złóż zamówienie na nowe części od dostawcy.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="part-select">Część</Label>
                  <select
                    id="part-select"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={newOrder.sparePartId}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, sparePartId: e.target.value })
                    }
                  >
                    <option value="">Wybierz część...</option>
                    {parts.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="order-quantity">Ilość</Label>
                  <Input
                    id="order-quantity"
                    type="number"
                    value={newOrder.quantity}
                    onChange={(e) =>
                      setNewOrder({ ...newOrder, quantity: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="delivery-date">Przewidywana Dostawa</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={newOrder.estimatedDelivery}
                    onChange={(e) =>
                      setNewOrder({
                        ...newOrder,
                        estimatedDelivery: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOrderPartsOpen(false)}
                >
                  Anuluj
                </Button>
                <Button onClick={handleOrderParts}>Złóż Zamówienie</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={addPartOpen} onOpenChange={setAddPartOpen}>
            <DialogTrigger asChild>
              <Button>Dodaj Część</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj Nową Część</DialogTitle>
                <DialogDescription>
                  Dodaj nową część zamienną do magazynu.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nazwa Części</Label>
                  <Input
                    id="name"
                    value={newPart.name}
                    onChange={(e) =>
                      setNewPart({ ...newPart, name: e.target.value })
                    }
                    placeholder="np. Dysk SSD 500GB"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Kategoria</Label>
                  <Input
                    id="category"
                    value={newPart.category}
                    onChange={(e) =>
                      setNewPart({ ...newPart, category: e.target.value })
                    }
                    placeholder="np. Dyski"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Ilość</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newPart.quantity}
                      onChange={(e) =>
                        setNewPart({ ...newPart, quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="minQuantity">Min. Ilość</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      value={newPart.minQuantity}
                      onChange={(e) =>
                        setNewPart({ ...newPart, minQuantity: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Cena (PLN)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newPart.price}
                    onChange={(e) =>
                      setNewPart({ ...newPart, price: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddPartOpen(false)}>
                  Anuluj
                </Button>
                <Button onClick={handleAddPart}>Dodaj Część</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={releasePartOpen} onOpenChange={setReleasePartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wydanie Części</DialogTitle>
            <DialogDescription>Wydaj część technikowi.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Część</Label>
              <Input
                value={
                  parts.find((p) => p.id === releaseData.partId)?.name || ""
                }
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Ilość</Label>
              <Input
                type="number"
                value={releaseData.quantity}
                onChange={(e) =>
                  setReleaseData({ ...releaseData, quantity: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleReleasePart}>Zatwierdź Wydanie</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Stan Magazynowy</TabsTrigger>
          <TabsTrigger value="orders">Zamówienia Części</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Lista Części</CardTitle>
              <CardDescription>
                Zarządzaj stanem magazynowym części zamiennych.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={partColumns}
                data={parts}
                searchKey="name"
                searchPlaceholder="Szukaj części..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Zamówienia do Dostawców</CardTitle>
              <CardDescription>
                Śledź status zamówień nowych części.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={orderColumns}
                data={orders}
                searchKey="id"
                searchPlaceholder="Szukaj zamówienia..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
