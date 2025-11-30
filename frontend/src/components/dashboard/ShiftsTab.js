import { useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, Plus, Trash2 } from "lucide-react";

function ShiftsTab({ shifts, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/shifts`, formData);
      toast.success("Turno criado com sucesso!");
      setOpen(false);
      setFormData({ name: "", start_time: "", end_time: "", description: "" });
      onRefresh();
    } catch (error) {
      console.error('Error creating shift:', error);
      toast.error(error.response?.data?.detail || "Erro ao criar turno");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shift) => {
    if (!window.confirm(`Deseja realmente excluir o turno "${shift.name}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/shifts/${shift.id}`);
      toast.success("Turno excluído com sucesso!");
      onRefresh();
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error("Erro ao excluir turno");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Turnos</CardTitle>
              <CardDescription>{shifts.length} turno(s) cadastrado(s)</CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-shift-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Turno</DialogTitle>
                  <DialogDescription>
                    Defina as informações do turno de trabalho
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Turno *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Manhã, Tarde, Noite"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="shift-name-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Horário de Início *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                        data-testid="shift-start-time-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Horário de Término *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                        data-testid="shift-end-time-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Informações adicionais sobre o turno"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      data-testid="shift-description-input"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading} data-testid="submit-shift-button">
                      {loading ? "Criando..." : "Criar Turno"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <Card key={shift.id} className="hover:shadow-lg transition-shadow" data-testid="shift-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">{shift.name}</CardTitle>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(shift)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-shift-${shift.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-sm">
                      {shift.start_time} - {shift.end_time}
                    </Badge>
                  </div>
                  {shift.description && (
                    <p className="text-sm text-gray-600">{shift.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    Criado em: {new Date(shift.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {shifts.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum turno cadastrado</p>
              <p className="text-sm text-gray-500 mt-2">Clique no botão acima para adicionar o primeiro turno</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ShiftsTab;
