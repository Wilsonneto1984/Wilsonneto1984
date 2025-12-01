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
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
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
      // Calcular data 30 dias atrás
      const endDate = selectedDate;
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      // Buscar colaboradores ativos e presença do período (últimos 30 dias)
      const [employeesRes, attendanceRes] = await Promise.all([
        axios.get(`${API}/employees?active_only=true`),
        axios.get(`${API}/attendance?start_date=${startDateStr}&end_date=${endDate}`)
      ]);
      
      setEmployees(employeesRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Se falhar sem autenticação, ainda funciona (API pública)
      if (error.response?.status !== 401) {
        toast.error("Erro ao carregar dados");
      }
    } finally {
      setLoading(false);
    }
  };

  // Combinar dados de colaboradores com presença
  const employeesWithAttendance = employees.map(emp => {
    const attendanceRecord = attendance.find(a => a.employee_chapa === emp.chapa);
    return {
      ...emp,
      attendance_status: attendanceRecord?.status || 'not_registered',
      hora_batida: attendanceRecord?.hora_batida || null
    };
  });

  const filteredEmployees = employeesWithAttendance.filter(emp =>
    emp.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.chapa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.funcao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separar por turno
  const diaEmployees = filteredEmployees.filter(e => e.turno === 'DIA');
  const noiteEmployees = filteredEmployees.filter(e => e.turno === 'NOITE');

  // Calcular estatísticas
  const calculateStats = (empList) => {
    const total = empList.length;
    const presente = empList.filter(e => e.attendance_status === 'P' || e.attendance_status === 'PN').length;
    const falta = empList.filter(e => e.attendance_status === 'FALTA').length;
    const folga = empList.filter(e => e.attendance_status === 'FO').length;
    const atestado = empList.filter(e => e.attendance_status === 'ATE').length;
    const naoRegistrado = empList.filter(e => e.attendance_status === 'not_registered').length;
    
    return { total, presente, falta, folga, atestado, naoRegistrado };
  };

  const statsAll = calculateStats(filteredEmployees);
  const statsDia = calculateStats(diaEmployees);
  const statsNoite = calculateStats(noiteEmployees);

  // Estatísticas por M.O
  const modStats = {
    dia: {
      mod: calculateStats(diaEmployees.filter(e => e.mo === 'M.O.D')),
      moi: calculateStats(diaEmployees.filter(e => e.mo === 'M.O.I'))
    },
    noite: {
      mod: calculateStats(noiteEmployees.filter(e => e.mo === 'M.O.D')),
      moi: calculateStats(noiteEmployees.filter(e => e.mo === 'M.O.I'))
    }
  };

  // Calcular Recordistas (colaboradores com mais ocorrências)
  const calculateRecordistas = (status, limit = 5) => {
    // Contar ocorrências por colaborador
    const counts = {};
    
    attendance.forEach(att => {
      if (att.status === status) {
        const employee = employees.find(e => e.chapa === att.employee_chapa);
        if (employee) {
          if (!counts[att.employee_chapa]) {
            counts[att.employee_chapa] = {
              chapa: att.employee_chapa,
              nome: employee.nome,
              count: 0
            };
          }
          counts[att.employee_chapa].count++;
        }
      }
    });

    // Ordenar e pegar top N
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  const recordistasFaltas = calculateRecordistas('FALTA');
  const recordistasAtestados = calculateRecordistas('ATE');
  const recordistasFolgas = calculateRecordistas('FO');

  const EmployeeTable = ({ employees, title, icon: Icon }) => (
    <div>
      <div className="flex items-center mb-4">
        <Icon className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="outline" className="ml-2">{employees.length}</Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chapa</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead>M.O</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                Nenhum colaborador encontrado
              </TableCell>
            </TableRow>
          ) : (
            employees.map((employee) => {
              const status = statusConfig[employee.attendance_status] || statusConfig.not_registered;
              return (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.chapa}</TableCell>
                  <TableCell>{employee.nome}</TableCell>
                  <TableCell className="text-sm">{employee.funcao}</TableCell>
                  <TableCell>{employee.grupo}</TableCell>
                  <TableCell>
                    <Badge variant={employee.mo === 'M.O.D' ? 'default' : 'outline'} className="text-xs">
                      {employee.mo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{employee.hora_batida || '-'}</TableCell>
                  <TableCell>
                    <Badge className={`${status.color} text-white text-xs`}>
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Carregando efetivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Controle de Efetivo</h1>
                <p className="text-sm text-gray-600 mt-1">Visualização Pública - Gestão de Presença</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/login')} 
              variant="default"
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Área Administrativa
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Date Selector */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center text-2xl">
                  <Calendar className="w-6 h-6 mr-3 text-blue-600" />
                  Resumo do Efetivo
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Data: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
                <Button onClick={fetchData} variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats Geral */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow">
                <p className="text-3xl font-bold text-gray-900">{statsAll.total}</p>
                <p className="text-sm font-medium text-gray-600 mt-1">Total</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl shadow">
                <p className="text-3xl font-bold text-green-700">{statsAll.presente}</p>
                <p className="text-sm font-medium text-green-800 mt-1">Presentes</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-xl shadow">
                <p className="text-3xl font-bold text-red-700">{statsAll.falta}</p>
                <p className="text-sm font-medium text-red-800 mt-1">Faltas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl shadow">
                <p className="text-3xl font-bold text-purple-700">{statsAll.folga}</p>
                <p className="text-sm font-medium text-purple-800 mt-1">Folgas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl shadow">
                <p className="text-3xl font-bold text-yellow-700">{statsAll.atestado}</p>
                <p className="text-sm font-medium text-yellow-800 mt-1">Atestados</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl shadow">
                <p className="text-3xl font-bold text-gray-700">{statsAll.naoRegistrado}</p>
                <p className="text-sm font-medium text-gray-800 mt-1">Não Reg.</p>
              </div>
            </div>

            {/* Stats por Turno e M.O */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
              {/* DIA */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <Sun className="w-5 h-5 text-orange-500 mr-2" />
                  <h4 className="font-bold text-lg">Turno DIA</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">M.O.D</p>
                    <p className="text-lg font-bold text-blue-900">
                      {modStats.dia.mod.presente}/{modStats.dia.mod.total}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">M.O.I</p>
                    <p className="text-lg font-bold text-blue-900">
                      {modStats.dia.moi.presente}/{modStats.dia.moi.total}
                    </p>
                  </div>
                </div>
              </div>

              {/* NOITE */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <Moon className="w-5 h-5 text-indigo-500 mr-2" />
                  <h4 className="font-bold text-lg">Turno NOITE</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <p className="text-xs text-indigo-600 font-medium">M.O.D</p>
                    <p className="text-lg font-bold text-indigo-900">
                      {modStats.noite.mod.presente}/{modStats.noite.mod.total}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <p className="text-xs text-indigo-600 font-medium">M.O.I</p>
                    <p className="text-lg font-bold text-indigo-900">
                      {modStats.noite.moi.presente}/{modStats.noite.moi.total}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recordistas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Recordistas - Faltas */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <div className="bg-red-100 p-2 rounded-lg mr-3">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                </div>
                Recordistas - Faltas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recordistasFaltas.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Sem dados</p>
              ) : (
                <div className="space-y-2">
                  {recordistasFaltas.map((item, index) => (
                    <div key={item.chapa} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{item.nome}</p>
                          <p className="text-xs text-gray-500">Chapa: {item.chapa}</p>
                        </div>
                      </div>
                      <Badge className="bg-red-500 text-white">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recordistas - Atestados */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                Recordistas - Atestados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recordistasAtestados.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Sem dados</p>
              ) : (
                <div className="space-y-2">
                  {recordistasAtestados.map((item, index) => (
                    <div key={item.chapa} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{item.nome}</p>
                          <p className="text-xs text-gray-500">Chapa: {item.chapa}</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500 text-white">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recordistas - Folgas */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                Recordistas - Folgas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recordistasFolgas.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Sem dados</p>
              ) : (
                <div className="space-y-2">
                  {recordistasFolgas.map((item, index) => (
                    <div key={item.chapa} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{item.nome}</p>
                          <p className="text-xs text-gray-500">Chapa: {item.chapa}</p>
                        </div>
                      </div>
                      <Badge className="bg-purple-500 text-white">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nome, chapa ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-lg shadow-md"
            />
          </div>
        </div>

        {/* Tabs por Turno */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-12">
                <TabsTrigger value="all" className="text-base">
                  <Users className="w-4 h-4 mr-2" />
                  Todos ({filteredEmployees.length})
                </TabsTrigger>
                <TabsTrigger value="dia" className="text-base">
                  <Sun className="w-4 h-4 mr-2" />
                  Turno DIA ({diaEmployees.length})
                </TabsTrigger>
                <TabsTrigger value="noite" className="text-base">
                  <Moon className="w-4 h-4 mr-2" />
                  Turno NOITE ({noiteEmployees.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <EmployeeTable employees={filteredEmployees} title="Todos os Colaboradores" icon={Users} />
              </TabsContent>

              <TabsContent value="dia" className="space-y-4">
                <EmployeeTable employees={diaEmployees} title="Colaboradores - Turno DIA" icon={Sun} />
              </TabsContent>

              <TabsContent value="noite" className="space-y-4">
                <EmployeeTable employees={noiteEmployees} title="Colaboradores - Turno NOITE" icon={Moon} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center bg-white px-6 py-3 rounded-full shadow-md">
            <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
            <p className="text-sm text-gray-600">
              Última atualização: {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicView;
