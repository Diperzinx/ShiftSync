import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OvertimeRecord {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  justification: string;
}

interface OvertimeListProps {
  userId: string;
  refreshKey: number;
}

const OvertimeList = ({ userId, refreshKey }: OvertimeListProps) => {
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecords = async () => {
      const { data, error } = await supabase
        .from("overtime_records")
        .select("*")
        .eq("user_id", userId)
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
      }
      setLoading(false);
    };

    fetchRecords();
  }, [userId, refreshKey, toast]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("overtime_records")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registro excluído",
        description: "O registro foi removido com sucesso.",
      });
      setRecords(records.filter((r) => r.id !== id));
    }
  };

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
    <Card>
      <CardHeader>
        <CardTitle>Meus Registros</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum registro encontrado. Comece registrando sua primeira hora extra!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Justificativa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
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
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OvertimeList;
