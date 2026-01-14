import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  /* 
  const [orders, setOrders] = useState<RepairOrder[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await api.orders.getAll();
      setOrders(data);
    };
    fetchData();
  }, []);
  */

  /* const totalWorkTime = orders.reduce((acc, order) => acc + (order.totalWorkTimeMinutes || 0), 0); */
  /* const avgWorkTime = orders.length > 0 ? Math.round(totalWorkTime / orders.length) : 0; */

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Raporty i Analizy</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Przychody (Miesięczne)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
              Wykres przychodów
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wydajność Techników</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
              Wykres wydajności
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
