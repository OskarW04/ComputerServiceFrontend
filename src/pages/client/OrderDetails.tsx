import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { api } from "@/data/api";
import type { RepairOrder, CostEstimate } from "@/data/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function ClientOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (id) {
        try {
          // Use client specific endpoint which includes estimate details
          const data = await api.client.getOrder(id);
          setOrder(data || null);
          if (data?.costEstimateResponse) {
            setEstimate(data.costEstimateResponse);
          }
        } catch (error) {
          console.error("Failed to fetch order", error);
          toast.error("Nie udało się pobrać szczegółów zlecenia");
        }
      }
    };
    fetchOrder();
  }, [id]);

  const handleAcceptEstimate = async () => {
    if (estimate && id) {
      try {
        await api.client.acceptEstimate(id);
        // Refresh
        const data = await api.client.getOrder(id);
        setOrder(data || null);
        if (data?.costEstimateResponse) {
          setEstimate(data.costEstimateResponse);
        }
        toast.success(
          "Kosztorys zaakceptowany. Naprawa rozpocznie się wkrótce.",
        );
      } catch (error) {
        console.error("Failed to accept estimate", error);
        toast.error("Wystąpił błąd podczas akceptacji kosztorysu");
      }
    }
  };

  const handleRejectEstimate = async () => {
    if (estimate && id) {
      try {
        await api.client.rejectEstimate(id);
        // Refresh
        const data = await api.client.getOrder(id);
        setOrder(data || null);
        if (data?.costEstimateResponse) {
          setEstimate(data.costEstimateResponse);
        }
        toast.success("Kosztorys odrzucony. Skontaktujemy się z Tobą.");
      } catch (error) {
        console.error("Failed to reject estimate", error);
        toast.error("Wystąpił błąd podczas odrzucania kosztorysu");
      }
    }
  };

  if (!order) return <div>Ładowanie...</div>;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)}>
        ← Wróć
      </Button>

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Zlecenie #{order.orderNumber}
          </h2>
          <p className="text-muted-foreground">
            Utworzono: {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className="text-lg py-1">{order.status}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Szczegóły Urządzenia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">Urządzenie</h4>
              <p>{order.deviceDescription}</p>
            </div>
            <div>
              <h4 className="font-semibold">Opis Problemu</h4>
              <p>{order.problemDescription}</p>
            </div>
          </CardContent>
        </Card>

        {estimate && (
          <Card>
            <CardHeader>
              <CardTitle>Kosztorys Naprawy</CardTitle>
              <CardDescription>
                Wymaga Twojej akceptacji przed rozpoczęciem prac
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Części:</span>
                <span>{estimate.partsCost.toFixed(2)} PLN</span>
              </div>
              <div className="flex justify-between">
                <span>Robocizna:</span>
                <span>{estimate.labourCost.toFixed(2)} PLN</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Suma:</span>
                <span>{estimate.totalCost.toFixed(2)} PLN</span>
              </div>

              {estimate.approved === null && (
                <div className="flex gap-4 mt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleAcceptEstimate}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Akceptuj
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleRejectEstimate}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Odrzuć
                  </Button>
                </div>
              )}

              {estimate.approved === true && (
                <div className="flex items-center text-green-600 mt-4 font-medium">
                  <CheckCircle className="mr-2 h-4 w-4" /> Kosztorys
                  zaakceptowany
                </div>
              )}

              {estimate.approved === false && (
                <div className="flex items-center text-red-600 mt-4 font-medium">
                  <XCircle className="mr-2 h-4 w-4" /> Kosztorys odrzucony
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
