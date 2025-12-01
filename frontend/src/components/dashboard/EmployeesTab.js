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

function EmployeesTab({ employees, onRefresh, user }) {
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
  const [activeTab, setActiveTab] = useState("all");

  const isViewer = user?.role === 'company_viewer';

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
    const formDataUpload = new FormData();
    formDataUpload.append('file', csvFile);
    formDataUpload.append('date', csvDate);

    try {
      const response = await axios.post(`${API}/import/csv`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success(`CSV importado! Processados: ${response.data.processed}, Criados: ${response.data.created}, Atualizados: ${response.data.updated}`);
      if (response.data.errors && response.data.errors.length > 0) {
        console.log('Import errors:', response.data.errors);
        toast.warning(`${response.data.errors.length} avisos durante importação`);
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

  const activeEmployees = filteredEmployees.filter(e => e.active);
  const inactiveEmployees = filteredEmployees.filter(e => !e.active);
  const diaEmployees = activeEmployees.filter(e => e.turno === 'DIA');
  const noiteEmployees = activeEmployees.filter(e => e.turno === 'NOITE');

  const EmployeeTable = ({ employees, showActions = true }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Chapa</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Função</TableHead>
          <TableHead>Turno</TableHead>
          <TableHead>Grupo</TableHead>
          <TableHead>M.O</TableHead>
          <TableHead>Admissão</TableHead>
          {showActions && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 8 : 7} className="text-center text-gray-500 py-8">
              Nenhum colaborador encontrado
            </TableCell>
          </TableRow>
        ) : (
          employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.chapa}</TableCell>
              <TableCell>{employee.nome}</TableCell>
              <TableCell>{employee.funcao}</TableCell>
              <TableCell>
                <Badge variant={employee.turno === 'DIA' ? 'default' : 'secondary'}>
                  {employee.turno}
                </Badge>
              </TableCell>
              <TableCell>{employee.grupo}</TableCell>
              <TableCell>
                <Badge variant={employee.mo === 'M.O.D' ? 'default' : 'outline'}>
                  {employee.mo}
                </Badge>
              </TableCell>
              <TableCell>{employee.admissao || '-'}</TableCell>
              {showActions && (
                <TableCell className="text-right space-x-2">
                  {!isViewer && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(employee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {employee.active ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeactivate(employee)}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleReactivate(employee)}
                        >
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {isViewer && !employee.active && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleReactivate(employee)}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Reativar
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* CSV Import Card */}
      {!isViewer && (
        <Card>
          <CardHeader>
            <CardTitle>Importar Presença via CSV</CardTitle>
            <CardDescription>
              Formato: CHAPA, NOME, FUNCAO, BATIDA
              <br />
              <span className="text-xs text-gray-500">
                Lógica: Com hora → P (DIA) ou PN (NOITE) | Sem hora → FALTA
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="csv-file">Arquivo CSV</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="mt-1"
                />
              </div>
              <div className="w-48">
                <Label htmlFor="csv-date">Data da Presença</Label>
                <Input
                  id="csv-date"
                  type="date"
                  value={csvDate}
                  onChange={(e) => setCsvDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleCSVUpload}
                disabled={!csvFile || uploadingCSV}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingCSV ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Colaboradores</CardTitle>
              <CardDescription>
                Total: {employees.length} | Ativos: {activeEmployees.length} | Desmobilizados: {inactiveEmployees.length}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {/* Botão de Exportação */}
              <Button
                variant="outline"
                onClick={() => {
                  let url = `${API}/export/employees/excel`;
                  // Adicionar filtro de turno baseado na guia ativa
                  if (activeTab === 'dia') {
                    url += '?turno=DIA';
                  } else if (activeTab === 'noite') {
                    url += '?turno=NOITE';
                  } else if (activeTab === 'inactive') {
                    url += '?active=false';
                  }
                  // activeTab === 'all' não precisa de filtro
                  window.open(url, '_blank');
                }}
                title={
                  activeTab === 'dia' ? 'Exportar Turno DIA' :
                  activeTab === 'noite' ? 'Exportar Turno NOITE' :
                  activeTab === 'inactive' ? 'Exportar Desmobilizados' :
                  'Exportar Todos'
                }
              >
                <Upload className="w-4 h-4 mr-2 rotate-180" />
                Exportar Excel
              </Button>
              
              {!isViewer && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Adicionar Colaborador
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEmployee ? "Editar Colaborador" : "Novo Colaborador"}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do colaborador
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="chapa">Chapa *</Label>
                        <Input
                          id="chapa"
                          value={formData.chapa}
                          onChange={(e) => setFormData({ ...formData, chapa: e.target.value })}
                          required
                          disabled={!!editingEmployee}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome Completo *</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="funcao">Função *</Label>
                        <Input
                          id="funcao"
                          value={formData.funcao}
                          onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="turno">Turno *</Label>
                        <Select 
                          value={formData.turno} 
                          onValueChange={(value) => setFormData({ ...formData, turno: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DIA">DIA</SelectItem>
                            <SelectItem value="NOITE">NOITE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grupo">Grupo *</Label>
                        <Input
                          id="grupo"
                          value={formData.grupo}
                          onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                          required
                          placeholder="1, 2, 3, etc"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mo">Mão de Obra *</Label>
                        <Select 
                          value={formData.mo} 
                          onValueChange={(value) => setFormData({ ...formData, mo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M.O.D">M.O.D (Direta)</SelectItem>
                            <SelectItem value="M.O.I">M.O.I (Indireta)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admissao">Data de Admissão</Label>
                        <Input
                          id="admissao"
                          type="date"
                          value={formData.admissao}
                          onChange={(e) => setFormData({ ...formData, admissao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sindicato">Sindicato</Label>
                        <Input
                          id="sindicato"
                          value={formData.sindicato}
                          onChange={(e) => setFormData({ ...formData, sindicato: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="primeiro_acesso">Primeiro Acesso</Label>
                      <Input
                        id="primeiro_acesso"
                        type="date"
                        value={formData.primeiro_acesso}
                        onChange={(e) => setFormData({ ...formData, primeiro_acesso: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Salvando..." : (editingEmployee ? "Atualizar" : "Criar")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, chapa ou função..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" className="space-y-4" onValueChange={(value) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Todos ({activeEmployees.length})
              </TabsTrigger>
              <TabsTrigger value="dia">
                Turno DIA ({diaEmployees.length})
              </TabsTrigger>
              <TabsTrigger value="noite">
                Turno NOITE ({noiteEmployees.length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Desmobilizados ({inactiveEmployees.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <EmployeeTable employees={activeEmployees} />
            </TabsContent>

            <TabsContent value="dia">
              <EmployeeTable employees={diaEmployees} />
            </TabsContent>

            <TabsContent value="noite">
              <EmployeeTable employees={noiteEmployees} />
            </TabsContent>

            <TabsContent value="inactive">
              <EmployeeTable employees={inactiveEmployees} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployeesTab;
