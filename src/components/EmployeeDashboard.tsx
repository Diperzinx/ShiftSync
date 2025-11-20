import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Clock, LogOut, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OvertimeForm from "./OvertimeForm";
import OvertimeList from "./OvertimeList";

interface EmployeeDashboardProps {
  user: User;
}

const EmployeeDashboard = ({ user }: EmployeeDashboardProps) => {
  const [showForm, setShowForm] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMonthlyTotal = async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data } = await supabase
        .from("overtime_records")
        .select("total_hours")
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString().split("T")[0]);

      if (data) {
        const total = data.reduce((sum, record) => sum + Number(record.total_hours), 0);
        setMonthlyTotal(total);
      }
    };

    fetchMonthlyTotal();
  }, [user.id, refreshKey]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold text-primary">ShiftSync</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Bem-vindo, {user.user_metadata?.full_name || "Funcionário"}!</CardTitle>
            <CardDescription>Gerencie suas horas extras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de horas extras este mês</p>
                <p className="text-4xl font-bold text-primary">{monthlyTotal.toFixed(2)}h</p>
              </div>
              <Button onClick={() => setShowForm(!showForm)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                {showForm ? "Cancelar" : "Registrar Hora Extra"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <OvertimeForm userId={user.id} onSuccess={handleSuccess} />
        )}

        <OvertimeList userId={user.id} refreshKey={refreshKey} />
      </main>
    </div>
  );
};

export default EmployeeDashboard;
