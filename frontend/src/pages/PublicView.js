import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Calendar, Search, LogIn, RefreshCw, Sun, Moon, Building2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const statusConfig = {
  P: { label: "Presente", color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50" },
  PN: { label: "Presente Noite", color: "bg-blue-500", textColor: "text-blue-700", bgColor: "bg-blue-50" },
  FALTA: { label: "Falta", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" },
  ATE: { label: "Atestado", color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50" },
  FO: { label: "Folga", color: "bg-purple-500", textColor: "text-purple-700", bgColor: "bg-purple-50" },
  not_registered: { label: "Não Registrado", color: "bg-gray-400", textColor: "text-gray-700", bgColor: "bg-gray-50" },
};

function PublicView() {
  const [summary, setSummary] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, shiftsRes] = await Promise.all([
        axios.get(`${API}/attendance/summary?date=${selectedDate}`),
        axios.get(`${API}/shifts`)
      ]);
      setSummary(summaryRes.data);
      setShifts(shiftsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const getShiftName = (shiftId) => {
    const shift = shifts.find(s => s.id === shiftId);
    return shift ? `${shift.name} (${shift.start_time} - ${shift.end_time})` : "Sem turno";
  };

  const filteredEmployees = summary?.employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando efetivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Controle de Efetivo</h1>
                <p className="text-sm text-gray-600">Visualização Pública</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/login')} 
              variant="outline"
              data-testid="go-to-login-button"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Área Administrativa
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Date Selector and Stats */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Resumo do Efetivo
                  </CardTitle>
                  <CardDescription>Data: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                    data-testid="date-selector-input"
                  />
                  <Button onClick={fetchData} variant="outline" size="icon" data-testid="refresh-data-button">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{summary?.total_employees || 0}</p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{summary?.present || 0}</p>
                  <p className="text-sm text-green-700">Presentes</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{summary?.absent || 0}</p>
                  <p className="text-sm text-red-700">Faltas</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{summary?.medical_leave || 0}</p>
                  <p className="text-sm text-blue-700">Atestados</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{summary?.day_off || 0}</p>
                  <p className="text-sm text-purple-700">Folgas</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{summary?.vacation || 0}</p>
                  <p className="text-sm text-yellow-700">Férias</p>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">{summary?.not_registered || 0}</p>
                  <p className="text-sm text-gray-700">Não Reg.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nome, matrícula ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-employee-input"
            />
          </div>
        </div>

        {/* Employee List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => {
            const status = statusConfig[employee.status];
            return (
              <Card key={employee.id} className="hover:shadow-lg transition-shadow" data-testid="employee-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <CardDescription className="text-xs">Matr: {employee.employee_id}</CardDescription>
                    </div>
                    <Badge className={`${status.color} text-white`}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Cargo:</span>
                    <span>{employee.position}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Turno:</span>
                    <span>{getShiftName(employee.shift_id)}</span>
                  </div>
                  {employee.notes && (
                    <div className={`mt-3 p-2 rounded ${status.bgColor}`}>
                      <p className={`text-xs ${status.textColor}`}>
                        <strong>Obs:</strong> {employee.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredEmployees.length === 0 && (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum funcionário encontrado</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Última atualização: {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}

export default PublicView;
