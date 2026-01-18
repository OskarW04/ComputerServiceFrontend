import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/data/api";
import type { SparePart } from "@/data/schema";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useErrorDialog } from "@/context/GlobalErrorDialogContext";

export default function WarehouseDelivery() {
  const navigate = useNavigate();
  const { showError } = useErrorDialog();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState("1");

  // Items to be added in this delivery
  const [deliveryItems, setDeliveryItems] = useState<
    { partId: string; name: string; quantity: number }[]
  >([]);

  // Discrepancy State
  const [discrepancyOpen, setDiscrepancyOpen] = useState(false);
  const [discrepancyPartId, setDiscrepancyPartId] = useState("");
  const [discrepancyQuantity, setDiscrepancyQuantity] = useState("1");
  const [discrepancyReason, setDiscrepancyReason] = useState("");

  useEffect(() => {
    const fetchParts = async () => {
      const data = await api.parts.getAll();
      setParts(data);
    };
    fetchParts();
  }, []);

  const handleAddItem = () => {
    if (!selectedPartId || !quantity) return;
    const part = parts.find((p) => p.id === selectedPartId);
    if (!part) return;

    const qty = parseInt(quantity);
    if (qty <= 0) return;

    const existing = deliveryItems.find(
      (item) => item.partId === selectedPartId,
    );
    if (existing) {
      setDeliveryItems(
        deliveryItems.map((item) =>
          item.partId === selectedPartId
            ? { ...item, quantity: item.quantity + qty }
            : item,
        ),
      );
    } else {
      setDeliveryItems([
        ...deliveryItems,
        { partId: selectedPartId, name: part.name, quantity: qty },
      ]);
    }

    // Reset inputs
    setSelectedPartId("");
    setQuantity("1");
  };

  const handleRemoveItem = (partId: string) => {
    setDeliveryItems(deliveryItems.filter((item) => item.partId !== partId));
  };

  const handleConfirmDelivery = async () => {
    if (deliveryItems.length === 0) return;

    try {
      await api.warehouse.acceptDelivery(
        deliveryItems.map((item) => ({
          partId: item.partId,
          quantity: item.quantity,
        })),
      );

      toast.success(
        "Dostawa przyjęta pomyślnie. Stany magazynowe zaktualizowane.",
      );
      setDeliveryItems([]);
      // Refresh parts to show updated stock if we were displaying it
      const data = await api.parts.getAll();
      setParts(data);
    } catch (e) {
      console.error(e);
      showError("Błąd", "Wystąpił błąd podczas przyjmowania dostawy.");
    }
  };

  const handleReportDiscrepancy = async () => {
    if (!discrepancyPartId || !discrepancyQuantity || !discrepancyReason)
      return;

    try {
      await api.warehouse.reportDiscrepancy({
        partId: discrepancyPartId,
        quantity: parseInt(discrepancyQuantity),
        reason: discrepancyReason,
      });
      toast.success("Protokół rozbieżności wysłany.");
      setDiscrepancyOpen(false);
      setDiscrepancyPartId("");
      setDiscrepancyQuantity("1");
      setDiscrepancyReason("");
    } catch (e) {
      console.error(e);
      showError("Błąd", "Błąd wysyłania protokołu.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Przyjęcie Dostawy</h2>
        <div className="flex gap-2">
          <Dialog open={discrepancyOpen} onOpenChange={setDiscrepancyOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                Zgłoś Rozbieżność / Uszkodzenie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Protokół Rozbieżności</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Część</Label>
                  <Select
                    value={discrepancyPartId}
                    onValueChange={setDiscrepancyPartId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz część..." />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ilość (Uszkodzona/Brakująca)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={discrepancyQuantity}
                    onChange={(e) => setDiscrepancyQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Powód / Opis</Label>
                  <Textarea
                    placeholder="Opisz uszkodzenie lub niezgodność..."
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="destructive" onClick={handleReportDiscrepancy}>
                  Wyślij Protokół
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={() => navigate("/warehouse/inventory")}
          >
            Wróć do Magazynu
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dodaj Pozycję</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Część</Label>
              <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz część..." />
                </SelectTrigger>
                <SelectContent>
                  {parts.map((part) => (
                    <SelectItem key={part.id} value={part.id}>
                      {part.name} (Obecnie: {part.stockQuantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ilość</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleAddItem}
              disabled={!selectedPartId}
            >
              Dodaj do Listy
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista Przyjęcia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveryItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Brak pozycji na liście.
              </p>
            ) : (
              <div className="space-y-2">
                {deliveryItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border rounded-md bg-background"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Ilość: {item.quantity}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.partId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Usuń
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {deliveryItems.length > 0 && (
              <div className="pt-4 border-t">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleConfirmDelivery}
                >
                  Zatwierdź Dostawę
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
