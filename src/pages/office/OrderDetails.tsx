import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/data/api";
import type {
  RepairOrder,
  CostEstimate,
  Invoice,
  PaymentMethod,
  OrderStatus,
} from "@/data/schema";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { useErrorDialog } from "@/context/GlobalErrorDialogContext";

export default function OfficeOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showError } = useErrorDialog();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    deviceDescription: "",
    problemDescription: "",
    managerNotes: "",
    status: "NEW",
  });

  // Payment State
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const orderData = await api.orders.getById(id);
        setOrder(orderData || null);
        if (orderData) {
          setEditForm({
            deviceDescription: orderData.deviceDescription,
            problemDescription: orderData.problemDescription,
            managerNotes: orderData.managerNotes || "",
            status: orderData.status,
          });
        }

        const estimates = await api.estimates.getByOrderId(id);
        if (estimates.length > 0) setEstimate(estimates[0]);

        const inv = await api.invoices.getByOrderId(id);
        setInvoice(inv || null);
      }
    };
    fetchData();
  }, [id]);

  const handleSaveEdit = async () => {
    if (!order) return;
    try {
      if (editForm.status !== order.status) {
        await api.orders.updateStatus(order.id, editForm.status as OrderStatus);
      }
      await api.orders.update(order.id, {
        ...editForm,
        status: editForm.status as OrderStatus,
      });
      setOrder({
        ...order,
        ...editForm,
        status: editForm.status as OrderStatus,
      });
      setIsEditing(false);
      toast.success("Zmiany zapisane.");
    } catch {
      showError("Błąd", "Nie udało się zapisać zmian.");
    }
  };

  const handleAcceptEstimate = async () => {
    if (estimate) {
      try {
        await api.estimates.updateStatus(estimate.id, true);
        if (order) await api.orders.updateStatus(order.id, "IN_PROGRESS"); // Or waiting for parts

        // Refresh
        const estimates = await api.estimates.getByOrderId(id!);
        setEstimate(estimates[0]);
        const updatedOrder = await api.orders.getById(id!);
        setOrder(updatedOrder || null);
        toast.success("Kosztorys zaakceptowany.");
      } catch {
        showError("Błąd", "Nie udało się zaakceptować kosztorysu.");
      }
    }
  };

  const handleRejectEstimate = async () => {
    if (estimate) {
      try {
        await api.estimates.updateStatus(estimate.id, false);
        if (order) await api.orders.updateStatus(order.id, "CANCELLED");

        // Refresh
        const estimates = await api.estimates.getByOrderId(id!);
        setEstimate(estimates[0]);
        const updatedOrder = await api.orders.getById(id!);
        setOrder(updatedOrder || null);
        toast.success("Kosztorys odrzucony.");
      } catch {
        showError("Błąd", "Nie udało się odrzucić kosztorysu.");
      }
    }
  };

  const handleReleaseEquipment = async () => {
    if (!order) return;
    setPaymentOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!order || !estimate) return;
    setLoading(true);

    try {
      // 1. Create Invoice
      const newInvoice = await api.invoices.create({
        orderId: order.id,
        clientId: order.clientId,
        issueDate: new Date().toISOString(),
        totalAmount: estimate.totalCost,
        status: "PAID",
        paymentMethod: paymentMethod,
      });
      setInvoice(newInvoice);

      // 2. Update Order Status
      await api.orders.updateStatus(order.id, "COMPLETED");
      const updatedOrder = await api.orders.getById(order.id);
      setOrder(updatedOrder || null);

      setPaymentOpen(false);
      setLoading(false);
      toast.success("Płatność przyjęta, faktura wystawiona, sprzęt wydany.");
    } catch (e) {
      setLoading(false);
      showError("Błąd", "Błąd przetwarzania płatności.");
      console.error(e);
    }
  };

  if (!order) return <div>Ładowanie...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Zlecenie #{order.orderNumber}
        </h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate("/office/orders")}>
            Wróć
          </Button>
          {order.status === "READY_FOR_PICKUP" && (
            <Button onClick={handleReleaseEquipment}>
              Wydaj Sprzęt / Rozlicz
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Details */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Szczegóły Zlecenia</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Anuluj" : "Edytuj"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              {isEditing ? (
                <Select
                  value={editForm.status}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, status: v as OrderStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Nowe</SelectItem>
                    <SelectItem value="WAITING_FOR_TECHNICIAN">
                      Oczekuje na Technika
                    </SelectItem>
                    <SelectItem value="DIAGNOSING">W Diagnozie</SelectItem>
                    <SelectItem value="WAITING_FOR_ACCEPTANCE">
                      Oczekuje na Akceptację
                    </SelectItem>
                    <SelectItem value="WAITING_FOR_PARTS">
                      Oczekuje na Części
                    </SelectItem>
                    <SelectItem value="IN_PROGRESS">W Realizacji</SelectItem>
                    <SelectItem value="READY_FOR_PICKUP">
                      Gotowe do Odbioru
                    </SelectItem>
                    <SelectItem value="COMPLETED">Zakończone</SelectItem>
                    <SelectItem value="CANCELLED">Anulowane</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div>
                  <Badge>{order.status}</Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Urządzenie</Label>
              {isEditing ? (
                <Input
                  value={editForm.deviceDescription}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      deviceDescription: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="text-sm">{order.deviceDescription}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Opis Problemu</Label>
              {isEditing ? (
                <Textarea
                  value={editForm.problemDescription}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      problemDescription: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="text-sm">{order.problemDescription}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Uwagi Managera/Biura</Label>
              {isEditing ? (
                <Textarea
                  value={editForm.managerNotes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, managerNotes: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {order.managerNotes || "-"}
                </p>
              )}
            </div>

            {isEditing && (
              <Button onClick={handleSaveEdit} className="w-full">
                Zapisz Zmiany
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Financials / Estimate */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kosztorys i Finanse</CardTitle>
            </CardHeader>
            <CardContent>
              {estimate ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Części:</span>
                    <span>{estimate.partsCost.toFixed(2)} PLN</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Robocizna:</span>
                    <span>{estimate.labourCost.toFixed(2)} PLN</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Suma:</span>
                    <span>{estimate.totalCost.toFixed(2)} PLN</span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-medium">
                      Status Kosztorysu:
                    </span>
                    {estimate.approved === true && (
                      <Badge className="bg-green-600">Zaakceptowany</Badge>
                    )}
                    {estimate.approved === false && (
                      <Badge variant="destructive">Odrzucony</Badge>
                    )}
                    {estimate.approved === null && (
                      <Badge variant="outline">Oczekuje na decyzję</Badge>
                    )}
                  </div>

                  {estimate.approved === null && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleAcceptEstimate}
                      >
                        Akceptuj
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={handleRejectEstimate}
                      >
                        Odrzuć
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Brak kosztorysu. Technik musi najpierw zdiagnozować sprzęt.
                </p>
              )}
            </CardContent>
          </Card>

          {invoice && (
            <Card>
              <CardHeader>
                <CardTitle>Faktura / Paragon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Numer:</span>
                  <span className="font-mono">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span>
                    {format(new Date(invoice.issueDate), "yyyy-MM-dd")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kwota:</span>
                  <span className="font-bold">
                    {invoice.totalAmount.toFixed(2)} PLN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Metoda:</span>
                  <span>{invoice.paymentMethod}</span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Drukuj Dokument
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przyjęcie Płatności i Wydanie</DialogTitle>
            <DialogDescription>
              Potwierdź płatność, aby zamknąć zlecenie i wydać sprzęt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Do Zapłaty:</span>
              <span>{estimate?.totalCost.toFixed(2)} PLN</span>
            </div>
            <div className="space-y-2">
              <Label>Metoda Płatności</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Gotówka</SelectItem>
                  <SelectItem value="CARD">Karta</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Przelew</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleProcessPayment} disabled={loading}>
              {loading ? "Przetwarzanie..." : "Zatwierdź i Wydaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
