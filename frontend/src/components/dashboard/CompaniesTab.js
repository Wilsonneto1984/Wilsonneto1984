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
import { Building2, Plus, Edit, Eye, UserPlus, Key } from "lucide-react";

function CompaniesTab({ companies, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    company_code: "",
    subscription_type: "monthly",
    admin_email: "",
    admin_password: "",
    admin_name: ""
  });
  const [loading, setLoading] = useState(false);

  const handleOpenDialog = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        company_code: company.company_code,
        subscription_type: company.subscription_type,
        admin_email: "",
        admin_password: "",
        admin_name: ""
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: "",
        company_code: "",
        subscription_type: "monthly",
        admin_email: "",
        admin_password: "",
        admin_name: ""
      });
    }
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCompany) {
        // Update company
        await axios.put(`${API}/companies/${editingCompany.id}`, {
          name: formData.name,
          company_code: formData.company_code,
          subscription_type: formData.subscription_type
        });
        toast.success("Empresa atualizada com sucesso!");
      } else {
        // Create company
        await axios.post(`${API}/companies`, formData);
        toast.success("Empresa criada com sucesso!");
      }
      setOpen(false);
      onRefresh();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error(error.response?.data?.detail || "Erro ao salvar empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (company) => {
    try {
      await axios.put(`${API}/companies/${company.id}`, {
        active: !company.active
      });
      toast.success(`Empresa ${company.active ? 'desativada' : 'ativada'} com sucesso!`);
      onRefresh();
    } catch (error) {
      console.error('Error toggling company:', error);
      toast.error("Erro ao alterar status da empresa");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date < new Date();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Empresas</CardTitle>
              <CardDescription>
                Total de empresas: {companies.length}
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingCompany ? "Editar Empresa" : "Nova Empresa"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCompany 
                      ? "Atualize os dados da empresa" 
                      : "Crie uma nova empresa com administrador"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Empresa *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Ex: REVAP - São José"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_code">Código de Acesso *</Label>
                      <Input
                        id="company_code"
                        value={formData.company_code}
                        onChange={(e) => setFormData({ ...formData, company_code: e.target.value.toUpperCase() })}
                        required
                        placeholder="Ex: REVAP2024"
                        disabled={!!editingCompany}
                      />
                      <p className="text-xs text-gray-500">
                        {editingCompany ? "Código não pode ser alterado" : "Será usado no login"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subscription_type">Tipo de Assinatura *</Label>
                    <Select 
                      value={formData.subscription_type} 
                      onValueChange={(value) => setFormData({ ...formData, subscription_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="annual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {!editingCompany && (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <h3 className="text-sm font-semibold mb-3 flex items-center">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Administrador da Empresa
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="admin_name">Nome do Admin *</Label>
                            <Input
                              id="admin_name"
                              value={formData.admin_name}
                              onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                              required
                              placeholder="Nome completo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="admin_email">Email do Admin *</Label>
                            <Input
                              id="admin_email"
                              type="email"
                              value={formData.admin_email}
                              onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                              required
                              placeholder="admin@empresa.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="admin_password">Senha do Admin *</Label>
                            <Input
                              id="admin_password"
                              type="password"
                              value={formData.admin_password}
                              onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                              required
                              placeholder="Senha forte"
                              minLength={6}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Salvando..." : (editingCompany ? "Atualizar" : "Criar Empresa")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhuma empresa cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => {
                  const expired = isExpired(company.subscription_expires_at);
                  return (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-xs text-gray-500">ID: {company.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Key className="w-3 h-3 text-blue-600" />
                          <code className="text-sm font-mono bg-blue-50 px-2 py-1 rounded">
                            {company.company_code}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.subscription_type === 'annual' ? 'default' : 'outline'}>
                          {company.subscription_type === 'monthly' ? 'Mensal' : 'Anual'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={expired ? 'text-red-600 font-medium' : ''}>
                          {formatDate(company.subscription_expires_at)}
                          {expired && ' (Expirado)'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={company.active ? 'default' : 'destructive'}
                          className={company.active ? 'bg-green-500' : ''}
                        >
                          {company.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(company)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={company.active ? 'destructive' : 'default'}
                          onClick={() => handleToggleActive(company)}
                        >
                          {company.active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900">Como as empresas fazem login:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Acessam <code className="bg-blue-100 px-1 rounded">/login</code></li>
                <li>Clicam em "Usar código da empresa"</li>
                <li>Digitam o <strong>Código de Acesso</strong> da empresa</li>
                <li>Digitam <strong>Email</strong> e <strong>Senha</strong></li>
                <li>Sistema valida e dá acesso aos dados da empresa</li>
              </ol>
              <p className="text-xs text-blue-600 mt-2">
                💡 Super Admin não precisa de código da empresa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CompaniesTab;
