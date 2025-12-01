import { useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Mail, Lock, User, Key, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    company_code: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    confirm_password: ""
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.company_name.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return false;
    }
    if (!formData.company_code.trim()) {
      toast.error("Código da empresa é obrigatório");
      return false;
    }
    if (formData.company_code.length < 6) {
      toast.error("Código deve ter no mínimo 6 caracteres");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.admin_name.trim()) {
      toast.error("Nome do administrador é obrigatório");
      return false;
    }
    if (!formData.admin_email.trim()) {
      toast.error("Email é obrigatório");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.admin_email)) {
      toast.error("Email inválido");
      return false;
    }
    if (formData.admin_password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return false;
    }
    if (formData.admin_password !== formData.confirm_password) {
      toast.error("As senhas não coincidem");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/register/company`, {
        company_name: formData.company_name,
        company_code: formData.company_code.toUpperCase(),
        admin_name: formData.admin_name,
        admin_email: formData.admin_email,
        admin_password: formData.admin_password
      });

      toast.success("Empresa cadastrada com sucesso! 🎉");
      toast.success("Você tem 30 dias de trial gratuito!");
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login/empresa');
      }, 2000);

    } catch (error) {
      console.error('Error registering:', error);
      if (error.response?.status === 409) {
        toast.error("Código da empresa já está em uso");
      } else {
        toast.error(error.response?.data?.detail || "Erro ao cadastrar empresa");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Cadastre sua Empresa</h1>
          <p className="text-gray-600 mt-2">
            30 dias de trial gratuito • Sem cartão de crédito
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium">Empresa</span>
            </div>
            
            <div className="w-12 h-0.5 bg-gray-300"></div>
            
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Administrador</span>
            </div>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>
              {step === 1 ? 'Dados da Empresa' : 'Dados do Administrador'}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Preencha as informações da sua empresa' 
                : 'Crie sua conta de administrador'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit} className="space-y-4">
              
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">
                      Nome da Empresa *
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="company_name"
                        placeholder="Ex: REVAP - Refinaria do Vale do Paraíba"
                        value={formData.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        className="pl-10"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_code">
                      Código da Empresa * (mínimo 6 caracteres)
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="company_code"
                        placeholder="Ex: REVAP2024"
                        value={formData.company_code}
                        onChange={(e) => handleChange('company_code', e.target.value.toUpperCase())}
                        className="pl-10 uppercase"
                        required
                        maxLength={20}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Este código será usado para acesso público e login
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mt-6">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">O que você ganha:</p>
                        <ul className="space-y-1 text-blue-700">
                          <li>✓ 30 dias de trial gratuito</li>
                          <li>✓ Acesso completo a todas as funcionalidades</li>
                          <li>✓ Gerenciamento de funcionários ilimitado</li>
                          <li>✓ Controle de presença e turnos</li>
                          <li>✓ Relatórios e exportações</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="admin_name">
                      Nome Completo *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="admin_name"
                        placeholder="Seu nome completo"
                        value={formData.admin_name}
                        onChange={(e) => handleChange('admin_name', e.target.value)}
                        className="pl-10"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_email">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="admin_email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.admin_email}
                        onChange={(e) => handleChange('admin_email', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_password">
                      Senha * (mínimo 6 caracteres)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="admin_password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.admin_password}
                        onChange={(e) => handleChange('admin_password', e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">
                      Confirmar Senha *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="confirm_password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirm_password}
                        onChange={(e) => handleChange('confirm_password', e.target.value)}
                        className="pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 mt-6">
                    <p className="text-sm text-green-800">
                      <strong>🎉 Parabéns!</strong> Após o cadastro, você terá acesso imediato ao sistema por 30 dias gratuitamente.
                    </p>
                  </div>
                </>
              )}

              <div className="flex space-x-3 pt-4">
                {step === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                )}
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </div>
                  ) : step === 1 ? (
                    'Próximo'
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/login/empresa')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
