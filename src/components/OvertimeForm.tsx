import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface OvertimeFormProps {
  userId: string;
  onSuccess: () => void;
}

const OvertimeForm = ({ userId, onSuccess }: OvertimeFormProps) => {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [justification, setJustification] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    return (endMinutes - startMinutes) / 60;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalHours = calculateHours(startTime, endTime);

      if (totalHours <= 0) {
        throw new Error("Hora de fim deve ser após a hora de início");
      }

      const { error } = await supabase.from("overtime_records").insert({
        user_id: userId,
        date,
        start_time: startTime,
        end_time: endTime,
        total_hours: totalHours,
        justification,
      });

      if (error) throw error;

      toast({
        title: "Hora extra registrada!",
        description: `${totalHours.toFixed(2)} horas adicionadas com sucesso.`,
      });

      setDate("");
      setStartTime("");
      setEndTime("");
      setJustification("");
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalHours = calculateHours(startTime, endTime);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nova Hora Extra</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora de Início</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora de Fim</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {totalHours > 0 && (
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <p className="text-sm font-medium">
                Total: <span className="text-lg text-accent">{totalHours.toFixed(2)} horas</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="justification">Justificativa</Label>
            <Textarea
              id="justification"
              placeholder="Descreva o motivo da hora extra..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              required
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Registro"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OvertimeForm;
