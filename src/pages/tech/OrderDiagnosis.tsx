import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/data/api';
import type { RepairOrder, OrderStatus, SparePart, ServiceAction, CostEstimate } from '@/data/schema';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OrderDiagnosis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<RepairOrder | null>(null);
  const [status, setStatus] = useState<OrderStatus>('NEW');
  const [notes, setNotes] = useState('');
  
  // Quote State
  const [parts, setParts] = useState<SparePart[]>([]);
  const [services, setServices] = useState<ServiceAction[]>([]);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedParts, setSelectedParts] = useState<{partId: string, quantity: number}[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [existingEstimate, setExistingEstimate] = useState<CostEstimate | null>(null);

  // Part Request State
  const [requestPartOpen, setRequestPartOpen] = useState(false);
  const [requestPartId, setRequestPartId] = useState('');
  const [requestQuantity, setRequestQuantity] = useState('1');

  // Repair Execution State
  const [usedParts, setUsedParts] = useState<string[]>([]); // IDs of parts marked as used

  useEffect(() => {
    const fetchOrder = async () => {
      if (id) {
        const data = await api.orders.getById(id);
        if (data) {
          setOrder(data);
          setStatus(data.status);
          setNotes(data.diagnosisDescription || '');
        }
      }
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
      const fetchResources = async () => {
          const p = await api.parts.getAll();
          setParts(p);
          const s = await api.services.getAll();
          setServices(s);
          if (id) {
              const estimates = await api.estimates.getByOrderId(id);
              if (estimates.length > 0) setExistingEstimate(estimates[0]);
          }
      };
      fetchResources();
  }, [id]);

  const handleStartDiagnosis = async () => {
      if (!order) return;
      await api.orders.updateStatus(order.id, 'DIAGNOSING');
      setOrder({ ...order, status: 'DIAGNOSING' });
      setStatus('DIAGNOSING');
  };

  const handleUnrepairable = async () => {
      if (!order) return;
      if (!confirm('Czy na pewno chcesz oznaczyć sprzęt jako nienaprawialny?')) return;
      
      await api.orders.update(order.id, { 
          status: 'CANCELLED',
          diagnosisDescription: notes 
      });
      alert('Zlecenie oznaczone jako nienaprawialne.');
      navigate('/tech/tasks');
  };

  const handleCreateQuote = async () => {
      if (!order) return;
      
      let partsCost = 0;
      selectedParts.forEach(sp => {
          const part = parts.find(p => p.id === sp.partId);
          if (part) partsCost += part.price * sp.quantity;
      });

      let labourCost = 0;
      selectedServices.forEach(sid => {
          const service = services.find(s => s.id === sid);
          if (service) labourCost += service.price;
      });

      // Create Estimate
      await api.estimates.create({
          orderId: order.id,
          partsCost,
          labourCost,
          totalCost: partsCost + labourCost,
          parts: selectedParts.map(sp => {
              const part = parts.find(p => p.id === sp.partId);
              return {
                  partId: sp.partId,
                  quantity: sp.quantity,
                  name: part?.name || 'Unknown',
                  price: part?.price || 0
              };
          })
      });

      // Update Order with Diagnosis and Status
      await api.orders.update(order.id, {
          status: 'WAITING_FOR_ACCEPTANCE',
          diagnosisDescription: notes
      });

      alert(`Diagnoza zakończona. Utworzono kosztorys na kwotę: ${partsCost + labourCost} PLN`);
      setQuoteOpen(false);
      navigate('/tech/tasks');
  };

  const handleRequestPart = async () => {
      if (!order) return;
      await api.partOrders.create({
          sparePartId: requestPartId,
          quantity: parseInt(requestQuantity),
          orderDate: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 86400000 * 3).toISOString(), // +3 days
          repairOrderId: order.id
      });
      alert('Zapotrzebowanie zgłoszone.');
      setRequestPartOpen(false);
      await api.orders.updateStatus(order.id, 'WAITING_FOR_PARTS');
      navigate('/tech/tasks');
  };

  const handleUpdate = async () => {
    if (order) {
      await api.orders.updateStatus(order.id, status);
      alert('Status zaktualizowany!');
      navigate('/tech/tasks');
    }
  };

  const handleConfirmPartUsage = async (partId: string, quantity: number) => {
      try {
          await api.parts.consume(partId, quantity);
          setUsedParts([...usedParts, partId]);
          // Refresh parts to show updated stock
          const p = await api.parts.getAll();
          setParts(p);
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleFinishRepair = async () => {
      if (!order) return;
      // Check if all parts are used (optional, but good for UX)
      if (existingEstimate && existingEstimate.parts.length > 0) {
          const allUsed = existingEstimate.parts.every(p => usedParts.includes(p.partId));
          if (!allUsed && !confirm('Nie wszystkie części zostały oznaczone jako zużyte. Czy na pewno zakończyć naprawę?')) {
              return;
          }
      }

      await api.orders.updateStatus(order.id, 'READY_FOR_PICKUP');
      alert('Naprawa zakończona. Status zmieniony na "Gotowe do odbioru".');
      navigate('/tech/tasks');
  };

  if (!order) return <div>Ładowanie...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Diagnoza / Naprawa</h2>
        <div className="flex gap-2">
            {order?.status === 'WAITING_FOR_TECHNICIAN' && (
                <Button onClick={handleStartDiagnosis} className="bg-blue-600 hover:bg-blue-700">
                    Rozpocznij Diagnozę
                </Button>
            )}
            <Button variant="outline" onClick={() => navigate(-1)}>Wróć</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Zlecenie #{order.orderNumber}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Urządzenie: {order.deviceDescription}</p>
            </div>
            <Badge>{order.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Opis Problemu (od Klienta)</h3>
            <div className="p-4 bg-muted rounded-md text-sm">
              {order.problemDescription}
            </div>
          </div>

          {status !== 'DIAGNOSING' && status !== 'WAITING_FOR_TECHNICIAN' && (
              <div className="space-y-2">
                <h3 className="font-semibold">Aktualizuj Status</h3>
                <Select value={status} onValueChange={(val) => setStatus(val as OrderStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WAITING_FOR_PARTS">Oczekiwanie na części</SelectItem>
                    <SelectItem value="IN_PROGRESS">W trakcie naprawy</SelectItem>
                    <SelectItem value="READY_FOR_PICKUP">Gotowe do odbioru</SelectItem>
                    <SelectItem value="COMPLETED">Zakończone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          )}

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
                        <div className="space-y-2">
                            <p>Status: <Badge>{existingEstimate.approved === null ? 'Oczekuje' : existingEstimate.approved ? 'Zatwierdzony' : 'Odrzucony'}</Badge></p>
                            <p>Suma: {existingEstimate.totalCost} PLN</p>
                            {status === 'DIAGNOSING' && (
                                <Button 
                                    className="w-full mt-2 bg-green-600 hover:bg-green-700"
                                    onClick={async () => {
                                        if (!order) return;
                                        await api.orders.update(order.id, {
                                            status: 'WAITING_FOR_ACCEPTANCE',
                                            diagnosisDescription: notes
                                        });
                                        alert('Diagnoza zakończona (kosztorys już istnieje).');
                                        navigate('/tech/tasks');
                                    }}
                                >
                                    Zakończ Diagnozę
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-green-600 hover:bg-green-700">Zakończ Diagnozę i Utwórz Kosztorys</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Nowy Kosztorys</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Usługi (Robocizna)</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {services.map(s => (
                                                <div key={s.id} className="flex items-center space-x-2">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`svc-${s.id}`}
                                                        checked={selectedServices.includes(s.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedServices([...selectedServices, s.id]);
                                                            else setSelectedServices(selectedServices.filter(id => id !== s.id));
                                                        }}
                                                    />
                                                    <label htmlFor={`svc-${s.id}`}>{s.name} ({s.price} PLN)</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Części</Label>
                                        <div className="space-y-2">
                                            {parts.map(p => (
                                                <div key={p.id} className="flex items-center justify-between border p-2 rounded">
                                                    <span>{p.name} ({p.price} PLN) - Stan: {p.quantity}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Button size="sm" variant="outline" onClick={() => {
                                                            const current = selectedParts.find(sp => sp.partId === p.id);
                                                            if (current) {
                                                                setSelectedParts(selectedParts.map(sp => sp.partId === p.id ? {...sp, quantity: sp.quantity + 1} : sp));
                                                            } else {
                                                                setSelectedParts([...selectedParts, {partId: p.id, quantity: 1}]);
                                                            }
                                                        }}>+</Button>
                                                        <span>{selectedParts.find(sp => sp.partId === p.id)?.quantity || 0}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateQuote}>Zatwierdź Kosztorys</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Części</CardTitle>
                </CardHeader>
                <CardContent>
                    <Dialog open={requestPartOpen} onOpenChange={setRequestPartOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="w-full">Zgłoś Zapotrzebowanie</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Zgłoś Brak Części</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Wybierz Część</Label>
                                    <Select value={requestPartId} onValueChange={setRequestPartId}>
                                        <SelectTrigger><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                                        <SelectContent>
                                            {parts.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Ilość</Label>
                                    <Input type="number" value={requestQuantity} onChange={e => setRequestQuantity(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleRequestPart}>Wyślij Zgłoszenie</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
          </div>



          {status === 'DIAGNOSING' && (
              <div className="flex gap-4 mt-6">
                  <Button variant="destructive" className="flex-1" onClick={handleUnrepairable}>
                      Oznacz jako Nienaprawialny
                  </Button>
                  {/* The create quote button is inside the dialog trigger above, but we can also have a direct save if needed. 
                      For now, the flow forces quote creation to finish diagnosis. */}
              </div>
          )}

          {/* Repair Execution Section */}
          {status === 'IN_PROGRESS' && (
              <Card className="mt-6 border-blue-200 bg-blue-50/50">
                  <CardHeader>
                      <CardTitle>Realizacja Naprawy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-2">
                          <h3 className="font-semibold">Części do wymiany (z kosztorysu)</h3>
                          {existingEstimate?.parts?.map((part, idx) => {
                              const stockPart = parts.find(p => p.id === part.partId);
                              const isUsed = usedParts.includes(part.partId);
                              const hasStock = (stockPart?.quantity || 0) >= part.quantity;

                              return (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-background border rounded-md">
                                      <div>
                                          <p className="font-medium">{part.name}</p>
                                          <p className="text-sm text-muted-foreground">Ilość: {part.quantity} | Magazyn: {stockPart?.quantity || 0}</p>
                                      </div>
                                      {isUsed ? (
                                          <Badge variant="default" className="bg-green-600">Zużyto</Badge>
                                      ) : (
                                          <Button 
                                              size="sm" 
                                              disabled={!hasStock} 
                                              onClick={() => handleConfirmPartUsage(part.partId, part.quantity)}
                                          >
                                              {hasStock ? 'Potwierdź Zużycie' : 'Brak na stanie'}
                                          </Button>
                                      )}
                                  </div>
                              );
                          })}
                          {(!existingEstimate?.parts || existingEstimate.parts.length === 0) && (
                              <p className="text-sm text-muted-foreground">Brak części do wymiany w kosztorysie.</p>
                          )}
                      </div>

                      <div className="pt-4 border-t">
                          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleFinishRepair}>
                              Zakończ Naprawę (Gotowe do Odbioru)
                          </Button>
                      </div>
                  </CardContent>
              </Card>
          )}

          {status !== 'DIAGNOSING' && status !== 'WAITING_FOR_TECHNICIAN' && status !== 'IN_PROGRESS' && (
              <Button className="w-full" onClick={handleUpdate}>
                Zapisz Zmiany
              </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
