import { useState } from "react";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, Lock } from "lucide-react";

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    company_code: "",
  });
  const [showCompanyCode, setShowCompanyCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, { 
        email: formData.email, 
        password: formData.password,
        company_code: formData.company_code 
      });
      toast.success("Login realizado com sucesso!");
      onLogin(response.data.access_token, response.data.user);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Controle de Efetivo</h1>
          <p className="text-gray-600 mt-2">Área Administrativa</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login de Editor</CardTitle>
            <CardDescription>Digite suas credenciais para acessar o painel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  data-testid="login-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  data-testid="login-password-input"
                />
              </div>
              
              {showCompanyCode && (
                <div className="space-y-2">
                  <Label htmlFor="company_code">Código da Empresa</Label>
                  <Input
                    id="company_code"
                    type="text"
                    placeholder="Digite o código da empresa"
                    value={formData.company_code}
                    onChange={(e) => setFormData({...formData, company_code: e.target.value})}
                    data-testid="login-company-code-input"
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowCompanyCode(!showCompanyCode)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showCompanyCode ? 'Ocultar código da empresa' : 'Usar código da empresa'}
                </button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Lock className="w-4 h-4 mr-2" />
                    Entrar
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">Credenciais de Teste:</p>
              <p className="text-sm text-blue-700">Super Admin: <strong>admin@system.com</strong></p>
              <p className="text-sm text-blue-700">Senha: <strong>admin123</strong></p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Voltar para visualização pública
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
