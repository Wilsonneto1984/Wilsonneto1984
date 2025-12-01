import { useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Building } from "lucide-react";

function SubcontractorsTab({ subcontractors, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [editingSubcontractor, setEditingSubcontractor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    employee_count: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSubcontractor) {
        // Editar subcontratada existente
        await axios.put(`${API}/subcontractors/${editingSubcontractor.id}`, formData);
        toast.success("Subcontratada atualizada com sucesso!");
      } else {
        // Criar nova subcontratada
        await axios.post(`${API}/subcontractors`, formData);
        toast.success("Subcontratada cadastrada com sucesso!");
      }

      setOpen(false);
      setFormData({ name: "", employee_count: "" });
      setEditingSubcontractor(null);
      onRefresh();
    } catch (error) {
      console.error('Error saving subcontractor:', error);
      toast.error(error.response?.data?.detail || "Erro ao salvar subcontratada");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subcontractor) => {
    setEditingSubcontractor(subcontractor);
    setFormData({
      name: subcontractor.name,
      employee_count: subcontractor.employee_count.toString()
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente excluir esta subcontratada?')) return;

    try {
      await axios.delete(`${API}/subcontractors/${id}`);
      toast.success("Subcontratada excluída com sucesso!");
      onRefresh();
    } catch (error) {
      console.error('Error deleting subcontractor:', error);
      toast.error("Erro ao excluir subcontratada");
    }
  };

  const handleOpenDialog = () => {
    setEditingSubcontractor(null);
    setFormData({ name: "", employee_count: "" });
    setOpen(true);
  };

  const totalEmployees = subcontractors.reduce((sum, sub) => sum + sub.employee_count, 0);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Subcontratadas</CardDescription>
            <CardTitle className="text-3xl">{subcontractors.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Funcionários</CardDescription>
            <CardTitle className="text-3xl">{totalEmployees}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Média por Empresa</CardDescription>
            <CardTitle className="text-3xl">
              {subcontractors.length > 0 ? Math.round(totalEmployees / subcontractors.length) : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Botão de adicionar */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Subcontratada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubcontractor ? 'Editar Subcontratada' : 'Nova Subcontratada'}
              </DialogTitle>
              <DialogDescription>
                Cadastre empresas subcontratadas e o número de funcionários
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Equipe de Tratamento Térmico"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_count">Quantidade de Funcionários *</Label>
                <Input
                  id="employee_count"
                  type="number"
                  min="0"
                  placeholder="Ex: 3"
                  value={formData.employee_count}
                  onChange={(e) => setFormData({...formData, employee_count: e.target.value})}
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setEditingSubcontractor(null);
                    setFormData({ name: "", employee_count: "" });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de subcontratadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-blue-600" />
            <CardTitle>Empresas Subcontratadas</CardTitle>
          </div>
          <CardDescription>
            Lista de todas as empresas subcontratadas cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subcontractors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma subcontratada cadastrada</p>
              <p className="text-sm">Clique em "Nova Subcontratada" para adicionar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nome da Empresa</TableHead>
                  <TableHead className="text-right">Funcionários</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcontractors.map((subcontractor, index) => (
                  <TableRow key={subcontractor.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{subcontractor.name}</TableCell>
                    <TableCell className="text-right">{subcontractor.employee_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(subcontractor)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(subcontractor.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SubcontractorsTab;
