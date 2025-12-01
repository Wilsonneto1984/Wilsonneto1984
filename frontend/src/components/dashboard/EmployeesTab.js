import { useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserPlus, Edit, Trash2, Search, UserMinus, UserCheck, Upload } from "lucide-react";

function EmployeesTab({ employees, shifts, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvDate, setCsvDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [formData, setFormData] = useState({
    chapa: "",
    nome: "",
    funcao: "",
    turno: "DIA",
    grupo: "",
    mo: "M.O.D",
    admissao: "",
    sindicato: "",
    primeiro_acesso: ""
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dia");

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        chapa: employee.chapa,
        nome: employee.nome,
        funcao: employee.funcao,
        turno: employee.turno,
        grupo: employee.grupo,
        mo: employee.mo,
        admissao: employee.admissao || "",
        sindicato: employee.sindicato || "",
        primeiro_acesso: employee.primeiro_acesso || ""
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        chapa: "",
        nome: "",
        funcao: "",
        turno: "DIA",
        grupo: "",
        mo: "M.O.D",
        admissao: "",
        sindicato: "",
        primeiro_acesso: ""
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingEmployee) {
        await axios.put(`${API}/employees/${editingEmployee.chapa}`, formData);
        toast.success("Colaborador atualizado com sucesso!");
      } else {
        await axios.post(`${API}/employees`, formData);
        toast.success("Colaborador criado com sucesso!");
      }
      setOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(error.response?.data?.detail || "Erro ao salvar colaborador");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (employee) => {
    if (!window.confirm(`Deseja realmente desmobilizar ${employee.nome}?`)) {
      return;
    }

    try {
      await axios.post(`${API}/employees/${employee.chapa}/deactivate`);
      toast.success("Colaborador desmobilizado com sucesso!");
      onRefresh();
    } catch (error) {
      console.error('Error deactivating employee:', error);
      toast.error("Erro ao desmobilizar colaborador");
    }
  };

  const handleReactivate = async (employee) => {
    if (!window.confirm(`Deseja realmente reativar ${employee.nome}?`)) {
      return;
    }

    try {
      await axios.post(`${API}/employees/${employee.chapa}/reactivate`);
      toast.success("Colaborador reativado com sucesso!");
      onRefresh();
    } catch (error) {
      console.error('Error reactivating employee:', error);
      toast.error("Erro ao reativar colaborador");
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      toast.error("Selecione um arquivo CSV");
      return;
    }

    setUploadingCSV(true);
    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('date', csvDate);

    try {
      const response = await axios.post(`${API}/import/csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(`CSV importado! Processados: ${response.data.processed}, Criados: ${response.data.created}, Atualizados: ${response.data.updated}`);
      if (response.data.errors.length > 0) {
        console.log('Import errors:', response.data.errors);
      }
      setCsvFile(null);
      onRefresh();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error(error.response?.data?.detail || "Erro ao importar CSV");
    } finally {
      setUploadingCSV(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    (emp.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.chapa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.funcao?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Funcionários</CardTitle>
              <CardDescription>{employees.length} funcionário(s) cadastrado(s)</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} data-testid="add-employee-button">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados do funcionário
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        data-testid="employee-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee_id">Matrícula *</Label>
                      <Input
                        id="employee_id"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        required
                        disabled={!!editingEmployee}
                        data-testid="employee-id-input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="position">Cargo *</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        required
                        data-testid="employee-position-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shift_id">Turno</Label>
                      <Select 
                        value={formData.shift_id} 
                        onValueChange={(value) => setFormData({ ...formData, shift_id: value })}
                      >
                        <SelectTrigger data-testid="employee-shift-select">
                          <SelectValue placeholder="Selecione um turno" />
                        </SelectTrigger>
                        <SelectContent>
                          {shifts.map(shift => (
                            <SelectItem key={shift.id} value={shift.id}>
                              {shift.name} ({shift.start_time} - {shift.end_time})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        data-testid="employee-phone-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        data-testid="employee-email-input"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} data-testid="submit-employee-button">
                      {loading ? "Salvando..." : editingEmployee ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
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
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} data-testid="employee-row">
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.employee_id}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getShiftName(employee.shift_id)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {employee.phone && <div>{employee.phone}</div>}
                      {employee.email && <div className="text-gray-500">{employee.email}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge className={employee.active ? "bg-green-500" : "bg-gray-500"}>
                        {employee.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(employee)}
                          data-testid={`edit-employee-${employee.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(employee)}
                          data-testid={`delete-employee-${employee.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum funcionário encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployeesTab;
