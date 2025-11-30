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
import { toast } from "sonner";
import { UserPlus, Edit, Trash2, Search } from "lucide-react";

function EmployeesTab({ employees, shifts, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    employee_id: "",
    position: "",
    shift_id: "",
    phone: "",
    email: ""
  });
  const [loading, setLoading] = useState(false);

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name,
        employee_id: employee.employee_id,
        position: employee.position,
        shift_id: employee.shift_id || "",
        phone: employee.phone || "",
        email: employee.email || ""
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: "",
        employee_id: "",
        position: "",
        shift_id: "",
        phone: "",
        email: ""
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingEmployee) {
        await axios.put(`${API}/employees/${editingEmployee.id}`, formData);
        toast.success("Funcionário atualizado com sucesso!");
      } else {
        await axios.post(`${API}/employees`, formData);
        toast.success("Funcionário criado com sucesso!");
      }
      setOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(error.response?.data?.detail || "Erro ao salvar funcionário");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`Deseja realmente desativar ${employee.name}?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/employees/${employee.id}`);
      toast.success("Funcionário desativado com sucesso!");
      onRefresh();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error("Erro ao desativar funcionário");
    }
  };

  const getShiftName = (shiftId) => {
    const shift = shifts.find(s => s.id === shiftId);
    return shift ? shift.name : "Sem turno";
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
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
