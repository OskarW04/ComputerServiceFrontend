import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { api } from "@/data/api";
import type {
  RepairOrder,
  OrderStatus,
  SparePart,
  ServiceAction,
  CostEstimate,
} from "@/data/schema";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useErrorDialog } from "@/context/GlobalErrorDialogContext";
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
import { formatStatus } from "@/lib/utils";

export default function OrderDiagnosis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useErrorDialog();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [status, setStatus] = useState<OrderStatus>("NEW");
  const [notes, setNotes] = useState("");

  // Quote State
  const [parts, setParts] = useState<SparePart[]>([]);
  const [services, setServices] = useState<ServiceAction[]>([]);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedParts, setSelectedParts] = useState<
    { partId: string; quantity: number }[]
  >([]);
  const [selectedServices, setSelectedServices] = useState<string[]>(["1"]);
  const [existingEstimate, setExistingEstimate] = useState<CostEstimate | null>(
    null,
  );

  // Repair Execution State
  // const [usedParts, setUsedParts] = useState<string[]>([]); // Removed

  // AlertDialog State
  const [unrepairableOpen, setUnrepairableOpen] = useState(false);
  // const [finishRepairOpen, setFinishRepairOpen] = useState(false);

  // Quote Filtering State
  const [partSearch, setPartSearch] = useState("");
  const filteredParts = parts.filter((p) =>
    p.name.toLowerCase().includes(partSearch.toLowerCase()),
  );

  useEffect(() => {
    const fetchOrder = async () => {
      if (id) {
        const data = await api.tech.getOrder(id);
        if (data) {
          setOrder(data);
          setStatus(data.status);
          setNotes(data.diagnosisDescription || "");
          if (data.costEstimateResponse) {
            setExistingEstimate(data.costEstimateResponse);
          }
        }
      }
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
    const fetchResources = async () => {
      const p = await api.parts.getAll();
      setParts(p);
      const s = await api.tech.getAllServices();
      setServices(s);
    };
    fetchResources();
  }, [id]);

  const handleStartDiagnosis = async () => {
    if (!order) return;
    await api.tech.startDiagnosing(order.id);
    setOrder({ ...order, status: "DIAGNOSING" });
    setStatus("DIAGNOSING");
    toast.success("Rozpoczęto diagnozę.");
  };

  const handleUnrepairable = async () => {
    if (!order) return;

    await api.orders.update(order.id, {
      status: "CANCELLED",
    });
    toast.info("Zlecenie oznaczone jako nienaprawialne.");
    navigate("/tech/tasks");
  };

  const handleCreateQuote = async () => {
    if (!order) return;

    let partsCost = 0;
    selectedParts.forEach((sp) => {
      const part = parts.find((p) => p.id === sp.partId);
      if (part) partsCost += part.price * sp.quantity;
    });

    let labourCost = 0;
    selectedServices.forEach((sid) => {
      const service = services.find((s) => s.id === sid);
      if (service) labourCost += service.price;
    });

    // Create Estimate
    try {
      await api.tech.generateCostEstimate(order.id, {
        message: "Kosztorys naprawy",
        partRequestList: selectedParts.map((sp) => ({
          sparePartId: parseInt(sp.partId),
          quantity: sp.quantity,
        })),
        serviceActionIds: selectedServices.map((id) => parseInt(id)),
      });

      // Update Order Status locally to reflect waiting for acceptance
      // The backend should handle the status update, but we update frontend state for immediate feedback/redirection
      setOrder({ ...order, status: "WAITING_FOR_ACCEPTANCE" });

      toast.success(
        `Diagnoza zakończona. Utworzono kosztorys na kwotę: ${partsCost + labourCost} PLN`,
      );
      setQuoteOpen(false);
      navigate("/tech/tasks");
    } catch {
      showError("Błąd", "Wystąpił błąd podczas tworzenia kosztorysu.");
    }
  };

  const handleFinishRepair = async () => {
    if (!order) return;

    try {
      await api.tech.finishOrder(order.id);
      toast.success(
        'Naprawa zakończona. Status zmieniony na "Gotowe do odbioru".',
      );
      navigate("/tech/tasks");
    } catch {
      showError("Błąd", "Nie udało się zakończyć naprawy.");
    }
  };

  if (!order) return <div>Ładowanie...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Diagnoza / Naprawa
        </h2>
        <div className="flex gap-2">
          {order?.status === "WAITING_FOR_TECHNICIAN" && (
            <Button
              onClick={handleStartDiagnosis}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Rozpocznij Diagnozę
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(-1)}>
            Wróć
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Zlecenie #{order.orderNumber}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Urządzenie: {order.deviceDescription}
              </p>
            </div>
            <Badge>{formatStatus(order.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Opis Problemu (od Klienta)</h3>
            <div className="p-4 bg-muted rounded-md text-sm">
              {order.problemDescription}
            </div>
          </div>

          {/* Workflow Actions based on Status */}
          <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
            <h3 className="font-semibold">Akcje Zlecenia</h3>

            {status === "WAITING_FOR_TECHNICIAN" ? (
              <Button
                onClick={handleStartDiagnosis}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Rozpocznij Diagnozę
              </Button>
            ) : status === "DIAGNOSING" ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Trwa diagnoza. Po zakończeniu wprowadź notatki i utwórz
                  kosztorys.
                </p>
              </div>
            ) : status === "WAITING_FOR_ACCEPTANCE" ? (
              <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-2 rounded">
                <span className="font-medium">
                  Oczekiwanie na akceptację klienta
                </span>
              </div>
            ) : status === "WAITING_FOR_PARTS" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-2 rounded">
                  <span className="font-medium">Oczekiwanie na części</span>
                </div>
                {/* Logic to check if parts have arrived could go here */}
              </div>
            ) : status === "IN_PROGRESS" ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Naprawa w toku. Zużyj części i zakończ naprawę.
                </p>
              </div>
            ) : status === "READY_FOR_PICKUP" ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded">
                <span className="font-medium">
                  Gotowe do odbioru / Zakończone przez technika
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Status: {status}</p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Notatki Techniczne</h3>
            <Textarea
              placeholder="Wpisz diagnozę lub przebieg naprawy..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kosztorys</CardTitle>
              </CardHeader>
              <CardContent>
                {existingEstimate ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">
                        Status:{" "}
                        <Badge
                          variant={
                            existingEstimate.approved
                              ? "default"
                              : existingEstimate.approved === false
                                ? "destructive"
                                : "outline"
                          }
                          className={
                            existingEstimate.approved
                              ? "bg-green-600 hover:bg-green-700"
                              : existingEstimate.approved === false
                                ? "bg-red-600"
                                : "bg-yellow-500 text-black hover:bg-yellow-600"
                          }
                        >
                          {existingEstimate.approved === null
                            ? "Oczekuje"
                            : existingEstimate.approved
                              ? "Zatwierdzony"
                              : "Odrzucony"}
                        </Badge>
                      </p>
                      <p className="font-bold text-lg">
                        Suma: {existingEstimate.totalCost} PLN
                      </p>
                    </div>

                    <div className="border rounded-md p-3 text-sm space-y-3">
                      <div>
                        <p className="font-semibold mb-1">Części:</p>
                        {existingEstimate.parts.length > 0 ? (
                          <ul className="space-y-1">
                            {existingEstimate.parts.map((p, idx) => (
                              <li
                                key={idx}
                                className="flex justify-between text-muted-foreground"
                              >
                                <span>
                                  {p.name} (x{p.quantity})
                                </span>
                                <span>{p.price * p.quantity} PLN</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Brak części
                          </span>
                        )}
                      </div>

                      <div className="border-t pt-2">
                        <p className="font-semibold mb-1">Usługi:</p>
                        {existingEstimate.actions.length > 0 ? (
                          <ul className="space-y-1">
                            {existingEstimate.actions.map((a, idx) => (
                              <li
                                key={idx}
                                className="flex justify-between text-muted-foreground"
                              >
                                <span>{a.name}</span>
                                <span>{a.price} PLN</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Brak usług
                          </span>
                        )}
                      </div>
                    </div>

                    {status === "DIAGNOSING" && (
                      <Button
                        className="w-full mt-2 bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          if (!order) return;
                          await api.orders.update(order.id, {
                            status: "WAITING_FOR_ACCEPTANCE",
                            // diagnosisDescription: notes, // API doesn't support this via update yet
                          });
                          toast.info(
                            "Diagnoza zakończona (kosztorys już istnieje).",
                          );
                          navigate("/tech/tasks");
                        }}
                      >
                        Zakończ Diagnozę
                      </Button>
                    )}
                  </div>
                ) : (
                  <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Zakończ Diagnozę i Utwórz Kosztorys
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Nowy Kosztorys</DialogTitle>
                      </DialogHeader>

                      <div className="flex-1 overflow-y-auto px-1 pr-4 min-h-0 space-y-6">
                        {/* Services Section */}
                        <div className="space-y-3">
                          <div className="sticky top-0 bg-background/95 backdrop-blur z-10 py-2 border-b">
                            <Label className="text-base font-semibold">
                              Usługi (Robocizna)
                            </Label>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {services.map((s) => {
                              const isMandatory = String(s.id) === "1";
                              return (
                                <div
                                  key={s.id}
                                  className={`flex items-start space-x-3 p-3 border rounded-lg transition-colors ${isMandatory ? "bg-muted/30" : "hover:bg-muted/50"}`}
                                >
                                  <input
                                    type="checkbox"
                                    id={`svc-${s.id}`}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                                    checked={
                                      isMandatory ||
                                      selectedServices.includes(String(s.id))
                                    }
                                    disabled={isMandatory}
                                    onChange={(e) => {
                                      if (isMandatory) return;
                                      if (e.target.checked)
                                        setSelectedServices([
                                          ...selectedServices,
                                          String(s.id),
                                        ]);
                                      else
                                        setSelectedServices(
                                          selectedServices.filter(
                                            (id) => id !== String(s.id),
                                          ),
                                        );
                                    }}
                                  />
                                  <label
                                    htmlFor={`svc-${s.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                                  >
                                    {s.name}
                                    <span className="block text-muted-foreground font-normal mt-1">
                                      {s.price} PLN
                                    </span>
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Parts Section */}
                        <div className="space-y-3">
                          <div className="sticky top-0 bg-background/95 backdrop-blur z-10 py-2 border-b space-y-2">
                            <Label className="text-base font-semibold">
                              Części
                            </Label>
                            <Input
                              placeholder="Szukaj części..."
                              value={partSearch}
                              onChange={(e) => setPartSearch(e.target.value)}
                              className="h-8"
                            />
                          </div>

                          <div className="space-y-2">
                            {filteredParts.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Brak części pasujących do zapytania.
                              </p>
                            )}
                            {filteredParts.map((p) => {
                              const currentQty =
                                selectedParts.find(
                                  (sp) => String(sp.partId) === String(p.id),
                                )?.quantity || 0;
                              return (
                                <div
                                  key={p.id}
                                  className={`flex items-center justify-between border p-3 rounded-lg transition-colors ${currentQty > 0 ? "bg-blue-50/50 border-blue-200" : "hover:bg-muted/50"}`}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-sm">
                                      {p.name}
                                    </span>
                                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                      <span>Cena: {p.price} PLN</span>
                                      <span>Stan: {p.stockQuantity}</span>
                                    </div>
                                    {currentQty > p.stockQuantity && (
                                      <span className="text-xs text-amber-600 font-semibold mt-1">
                                        Brak w magazynie - nastąpi zamówienie
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {currentQty > 0 && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                          const current = selectedParts.find(
                                            (sp) =>
                                              String(sp.partId) ===
                                              String(p.id),
                                          );
                                          if (current && current.quantity > 1) {
                                            setSelectedParts(
                                              selectedParts.map((sp) =>
                                                String(sp.partId) ===
                                                String(p.id)
                                                  ? {
                                                      ...sp,
                                                      quantity: sp.quantity - 1,
                                                    }
                                                  : sp,
                                              ),
                                            );
                                          } else {
                                            setSelectedParts(
                                              selectedParts.filter(
                                                (sp) =>
                                                  String(sp.partId) !==
                                                  String(p.id),
                                              ),
                                            );
                                          }
                                        }}
                                      >
                                        -
                                      </Button>
                                    )}

                                    <span
                                      className={`w-6 text-center font-mono font-medium ${currentQty > 0 ? "text-primary" : "text-muted-foreground"}`}
                                    >
                                      {currentQty}
                                    </span>

                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-8 w-8 bg-background"
                                      onClick={() => {
                                        const current = selectedParts.find(
                                          (sp) =>
                                            String(sp.partId) === String(p.id),
                                        );
                                        if (current) {
                                          setSelectedParts(
                                            selectedParts.map((sp) =>
                                              String(sp.partId) === String(p.id)
                                                ? {
                                                    ...sp,
                                                    quantity: sp.quantity + 1,
                                                  }
                                                : sp,
                                            ),
                                          );
                                        } else {
                                          setSelectedParts([
                                            ...selectedParts,
                                            { partId: p.id, quantity: 1 },
                                          ]);
                                        }
                                      }}
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <DialogFooter className="mt-2 pt-2 border-t">
                        <div className="mr-auto text-sm text-muted-foreground flex items-center">
                          Suma:{" "}
                          <span className="font-bold text-foreground ml-1">
                            {services
                              .filter((s) => selectedServices.includes(s.id))
                              .reduce((acc, s) => acc + s.price, 0) +
                              selectedParts.reduce((acc, sp) => {
                                const p = parts.find(
                                  (p) => String(p.id) === String(sp.partId),
                                );
                                return acc + (p ? p.price * sp.quantity : 0);
                              }, 0)}{" "}
                            PLN
                          </span>
                        </div>
                        <Button onClick={handleCreateQuote}>
                          Zatwierdź Kosztorys
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>

          {status === "DIAGNOSING" && (
            <div className="flex gap-4 mt-6">
              <AlertDialog
                open={unrepairableOpen}
                onOpenChange={setUnrepairableOpen}
              >
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setUnrepairableOpen(true)}
                >
                  Oznacz jako Nienaprawialny
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Czy jesteś pewien?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ta operacja spowoduje oznaczenie zlecenia jako
                      nienaprawialne i jego anulowanie. Jest to operacja
                      nieodwracalna.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleUnrepairable}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Tak, oznacz jako nienaprawialny
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {/* The create quote button is inside the dialog trigger above, but we can also have a direct save if needed. 
                      For now, the flow forces quote creation to finish diagnosis. */}
            </div>
          )}

          {/* Repair Execution Section */}
          {status === "IN_PROGRESS" && (
            <Card className="mt-6 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle>Realizacja Naprawy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    Części do wymiany (z kosztorysu)
                  </h3>
                  {existingEstimate?.parts?.map((part, idx) => {
                    const stockPart = parts.find(
                      (p) => String(p.id) === String(part.id),
                    );
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-background border rounded-md"
                      >
                        <div>
                          <p className="font-medium">{part.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Ilość: {part.quantity} | Magazyn:{" "}
                            {stockPart?.stockQuantity || 0}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(!existingEstimate?.parts ||
                    existingEstimate.parts.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      Brak części do wymiany w kosztorysie.
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleFinishRepair}
                  >
                    Zakończ Naprawę (Gotowe do Odbioru)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
