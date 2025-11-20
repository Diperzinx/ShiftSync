import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Clock className="h-16 w-16 text-accent" />
          <h1 className="text-6xl font-bold text-white">ShiftSync</h1>
        </div>
        
        <p className="text-xl text-white/90 max-w-2xl mx-auto">
          Sistema profissional de controle de horas extras. Registre, acompanhe e gerencie 
          suas horas de trabalho adicional de forma simples e eficiente.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-accent hover:bg-accent/90 text-white text-lg px-8 py-6"
          >
            Acessar Sistema
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-16 text-white/90">
          <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <h3 className="font-semibold text-lg mb-2">Registre Facilmente</h3>
            <p className="text-sm">Interface intuitiva para registrar suas horas extras rapidamente</p>
          </div>
          <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <h3 className="font-semibold text-lg mb-2">Acompanhe Totais</h3>
            <p className="text-sm">Visualize o total de horas acumuladas mensalmente</p>
          </div>
          <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <h3 className="font-semibold text-lg mb-2">Gestão Completa</h3>
            <p className="text-sm">Administradores têm visão completa de todos os registros</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
