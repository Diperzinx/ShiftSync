import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OvertimeRecordWithProfile {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  justification: string;
  profiles: {
    full_name: string;
    username: string;
  };
}

const AdminOvertimeView = () => {
  const [records, setRecords] = useState<OvertimeRecordWithProfile[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<OvertimeRecordWithProfile[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecords = async () => {
      const { data, error } = await supabase
        .from("overtime_records")
        .select(`
          *,
          profiles (
            full_name,
            username
          )
        `)
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });

      if (error) {
        toast({
          title: "Erro ao carregar registros",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setRecords(data || []);
        setFilteredRecords(data || []);
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthRecords = data?.filter(
          (r) => new Date(r.date) >= startOfMonth
        );
        const total = currentMonthRecords?.reduce(
          (sum, record) => sum + Number(record.total_hours),
          0
        ) || 0;
        setMonthlyTotal(total);
      }
      setLoading(false);
    };

    fetchRecords();
  }, [toast]);

  useEffect(() => {
    let filtered = records;

    if (searchTerm) {
      filtered = filtered.filter((record) =>
        record.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.profiles.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (monthFilter) {
      const [year, month] = monthFilter.split("-");
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getFullYear() === parseInt(year) &&
          recordDate.getMonth() + 1 === parseInt(month)
        );
      });
    }

    setFilteredRecords(filtered);
  }, [searchTerm, monthFilter, records]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Dashboard de Horas Extras</CardTitle>
          <CardDescription>Visualização geral de todas as horas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total de horas extras este mês</p>
            <p className="text-4xl font-bold text-accent">{monthlyTotal.toFixed(2)}h</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Registros</CardTitle>
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por funcionário</Label>
              <Input
                id="search"
                placeholder="Nome ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Filtrar por mês</Label>
              <Input
                id="month"
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Fim</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Justificativa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.profiles.full_name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{record.start_time}</TableCell>
                      <TableCell>{record.end_time}</TableCell>
                      <TableCell className="font-semibold text-accent">
                        {Number(record.total_hours).toFixed(2)}h
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.justification}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOvertimeView;
