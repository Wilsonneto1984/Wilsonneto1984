import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Save, RefreshCw } from "lucide-react";

const statusOptions = [
  { value: "present", label: "Presente", color: "bg-green-500" },
  { value: "absent", label: "Falta", color: "bg-red-500" },
  { value: "medical_leave", label: "Atestado Médico", color: "bg-blue-500" },
  { value: "day_off", label: "Folga", color: "bg-purple-500" },
  { value: "vacation", label: "Férias", color: "bg-yellow-500" },
];

function AttendanceTab({ employees, shifts, onRefresh }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [selectedDate]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/attendance/summary?date=${selectedDate}`);
      setSummary(response.data);
      
      // Pre-fill attendance data
      const data = {};
      response.data.employees.forEach(emp => {
        data[emp.id] = {
          status: emp.status !== 'not_registered' ? emp.status : '',
          notes: emp.notes || ''
        };
      });
      setAttendanceData(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error("Erro ao carregar resumo");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (employeeId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], status }
    }));
  };

  const handleNotesChange = (employeeId, notes) => {
    setAttendanceData(prev => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], notes }
    }));
  };

  const handleSave = async (employeeId) => {
    const data = attendanceData[employeeId];
    if (!data || !data.status) {
      toast.error("Selecione um status");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/attendance`, {
        employee_id: employeeId,
        date: selectedDate,
        status: data.status,
        notes: data.notes || null
      });
      toast.success("Presença registrada com sucesso!");
      fetchSummary();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error(error.response?.data?.detail || "Erro ao registrar presença");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const [employeeId, data] of Object.entries(attendanceData)) {
      if (data.status) {
        try {
          await axios.post(`${API}/attendance`, {
            employee_id: employeeId,
            date: selectedDate,
            status: data.status,
            notes: data.notes || null
          });
          successCount++;
        } catch (error) {
          console.error(`Error saving attendance for ${employeeId}:`, error);
          errorCount++;
        }
      }
    }

    setSaving(false);
    if (successCount > 0) {
      toast.success(`${successCount} registro(s) salvos com sucesso!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} erro(s) ao salvar`);
    }
    fetchSummary();
  };

  const getShiftName = (shiftId) => {
    const shift = shifts.find(s => s.id === shiftId);
    return shift ? shift.name : "Sem turno";
  };

  const filteredEmployees = summary?.employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Registro de Presença</CardTitle>
              <CardDescription>Data: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
                data-testid="attendance-date-input"
              />
              <Button onClick={fetchSummary} variant="outline" size="icon" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={handleSaveAll} disabled={saving} data-testid="save-all-attendance-button">
                <Save className="w-4 h-4 mr-2" />
                Salvar Todos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{summary?.total_employees || 0}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{summary?.present || 0}</p>
              <p className="text-xs text-green-700">Presentes</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-600">{summary?.absent || 0}</p>
              <p className="text-xs text-red-700">Faltas</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-600">{summary?.medical_leave || 0}</p>
              <p className="text-xs text-blue-700">Atestados</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xl font-bold text-purple-600">{summary?.day_off || 0}</p>
              <p className="text-xs text-purple-700">Folgas</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-xl font-bold text-yellow-600">{summary?.vacation || 0}</p>
              <p className="text-xs text-yellow-700">Férias</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Employee List */}
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="border-l-4 border-l-blue-500" data-testid="attendance-employee-card">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-3">
                      <h3 className="font-semibold text-lg">{employee.name}</h3>
                      <p className="text-sm text-gray-600">Mat: {employee.employee_id}</p>
                      <p className="text-sm text-gray-600">{employee.position}</p>
                      <Badge variant="outline" className="mt-1">{getShiftName(employee.shift_id)}</Badge>
                    </div>
                    <div className="md:col-span-3">
                      <Label>Status</Label>
                      <Select 
                        value={attendanceData[employee.id]?.status || ''}
                        onValueChange={(value) => handleStatusChange(employee.id, value)}
                      >
                        <SelectTrigger data-testid={`status-select-${employee.id}`}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${option.color} mr-2`}></div>
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-5">
                      <Label>Observações</Label>
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Observações adicionais..."
                          value={attendanceData[employee.id]?.notes || ''}
                          onChange={(e) => handleNotesChange(employee.id, e.target.value)}
                          rows={2}
                          data-testid={`notes-input-${employee.id}`}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <Button 
                        onClick={() => handleSave(employee.id)} 
                        disabled={saving || !attendanceData[employee.id]?.status}
                        className="w-full"
                        data-testid={`save-button-${employee.id}`}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AttendanceTab;
