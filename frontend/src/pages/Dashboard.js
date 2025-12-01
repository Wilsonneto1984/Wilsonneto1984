import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Clock, LogOut, BarChart3, Building2 } from "lucide-react";
import { toast } from "sonner";
import EmployeesTab from "@/components/dashboard/EmployeesTab";
import AttendanceTab from "@/components/dashboard/AttendanceTab";
import ShiftsTab from "@/components/dashboard/ShiftsTab";
import HistoryTab from "@/components/dashboard/HistoryTab";
import CompaniesTab from "@/components/dashboard/CompaniesTab";

function Dashboard({ user, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyCode, setCompanyCode] = useState(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        // Super admin busca apenas empresas e usuários
        const [companiesRes] = await Promise.all([
          axios.get(`${API}/companies`)
        ]);
        setCompanies(companiesRes.data);
      } else {
        // Company admin/viewer busca dados operacionais e company_code
        const [employeesRes, shiftsRes, companyRes] = await Promise.all([
          axios.get(`${API}/employees`),
          axios.get(`${API}/shifts`),
          axios.get(`${API}/companies/${user.company_id}`)
        ]);
        setEmployees(employeesRes.data);
        setShifts(shiftsRes.data);
        setCompanyCode(companyRes.data.company_code);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair?')) {
      onLogout();
      toast.success("Logout realizado com sucesso!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
                <p className="text-sm text-gray-600">Bem-vindo, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isSuperAdmin && companyCode && (
                <Button onClick={() => window.open(`/public/${companyCode}`, '_blank')} variant="outline" size="sm">
                  Visualizar Pública
                </Button>
              )}
              <Button onClick={handleLogout} variant="destructive" size="sm" data-testid="logout-button">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue={isSuperAdmin ? "companies" : "attendance"} className="space-y-6">
          {isSuperAdmin ? (
            // Super Admin - Apenas gestão de empresas
            <>
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="companies" data-testid="tab-companies">
                  <Building2 className="w-4 h-4 mr-2" />
                  Gerenciar Empresas
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="companies">
                <CompaniesTab companies={companies} onRefresh={fetchData} />
              </TabsContent>
            </>
          ) : (
            // Company Admin/Viewer - Gestão operacional
            <>
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="attendance" data-testid="tab-attendance">
                  <Calendar className="w-4 h-4 mr-2" />
                  Presença
                </TabsTrigger>
                <TabsTrigger value="employees" data-testid="tab-employees">
                  <Users className="w-4 h-4 mr-2" />
                  Funcionários
                </TabsTrigger>
                <TabsTrigger value="shifts" data-testid="tab-shifts">
                  <Clock className="w-4 h-4 mr-2" />
                  Turnos
                </TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Histórico
                </TabsTrigger>
              </TabsList>

              <TabsContent value="attendance">
                <AttendanceTab employees={employees} shifts={shifts} onRefresh={fetchData} />
              </TabsContent>

              <TabsContent value="employees">
                <EmployeesTab employees={employees} shifts={shifts} onRefresh={fetchData} user={user} />
              </TabsContent>

              <TabsContent value="shifts">
                <ShiftsTab shifts={shifts} onRefresh={fetchData} />
              </TabsContent>

              <TabsContent value="history">
                <HistoryTab employees={employees} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default Dashboard;
