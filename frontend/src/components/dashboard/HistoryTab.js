import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Search, Download, FileText } from "lucide-react";

const statusConfig = {
  present: { label: "Presente", color: "bg-green-500" },
  absent: { label: "Falta", color: "bg-red-500" },
  medical_leave: { label: "Atestado", color: "bg-blue-500" },
  day_off: { label: "Folga", color: "bg-purple-500" },
  vacation: { label: "Férias", color: "bg-yellow-500" },
};

function HistoryTab({ employees, shifts }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    employee_id: "",
    start_date: "",
    end_date: "",
    status: ""
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setFilters(prev => ({
      ...prev,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    }));
  }, []);

  useEffect(() => {
    if (filters.start_date && filters.end_date) {
      fetchRecords();
    }
  }, [filters]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.employee_id) params.append('employee_id', filters.employee_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.status) params.append('status', filters.status);

      const response = await axios.get(`${API}/attendance?${params.toString()}`);
      setRecords(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      present: data.filter(r => r.status === 'present').length,
      absent: data.filter(r => r.status === 'absent').length,
      medical_leave: data.filter(r => r.status === 'medical_leave').length,
      day_off: data.filter(r => r.status === 'day_off').length,
      vacation: data.filter(r => r.status === 'vacation').length,
    };
    setStats(stats);
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.name} (${employee.employee_id})` : employeeId;
  };

  const handleExport = () => {
    if (records.length === 0) {
      toast.error("Nenhum registro para exportar");
      return;
    }

    // Create CSV content
    const headers = ['Data', 'Funcionário', 'Matrícula', 'Status', 'Observações', 'Registrado em'];
    const csvData = records.map(record => {
      const employee = employees.find(e => e.id === record.employee_id);
      return [
        record.date,
        employee?.name || '',
        employee?.employee_id || '',
        statusConfig[record.status]?.label || record.status,
        record.notes || '',
        new Date(record.registered_at).toLocaleString('pt-BR')
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico_presenca_${filters.start_date}_${filters.end_date}.csv`;
    link.click();
    
    toast.success("Histórico exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Pesquisa</CardTitle>
          <CardDescription>Busque registros de presença por período e status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select 
                value={filters.employee_id} 
                onValueChange={(value) => setFilters({ ...filters, employee_id: value })}
              >
                <SelectTrigger data-testid="history-employee-filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os funcionários</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                data-testid="history-start-date-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                data-testid="history-end-date-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger data-testid="history-status-filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleExport} variant="outline" className="w-full" data-testid="export-history-button">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas do Período</CardTitle>
            <CardDescription>
              {filters.start_date && filters.end_date && `${new Date(filters.start_date + 'T00:00:00').toLocaleDateString('pt-BR')} - ${new Date(filters.end_date + 'T00:00:00').toLocaleDateString('pt-BR')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-sm text-green-700">Presentes</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-sm text-red-700">Faltas</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.medical_leave}</p>
                <p className="text-sm text-blue-700">Atestados</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.day_off}</p>
                <p className="text-sm text-purple-700">Folgas</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{stats.vacation}</p>
                <p className="text-sm text-yellow-700">Férias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Registros</CardTitle>
          <CardDescription>{records.length} registro(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando registros...</p>
            </div>
          ) : records.length > 0 ? (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Registrado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const status = statusConfig[record.status];
                    return (
                      <TableRow key={record.id} data-testid="history-record-row">
                        <TableCell className="font-medium">
                          {new Date(record.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{getEmployeeName(record.employee_id)}</TableCell>
                        <TableCell>
                          <Badge className={`${status?.color} text-white`}>
                            {status?.label || record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.notes || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(record.registered_at).toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum registro encontrado</p>
              <p className="text-sm text-gray-500 mt-2">Ajuste os filtros para ver diferentes resultados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default HistoryTab;
