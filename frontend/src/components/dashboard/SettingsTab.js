import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, CreditCard, DollarSign, Save, Eye, EyeOff } from "lucide-react";

function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [config, setConfig] = useState({
    mp_public_key: "",
    mp_access_token: "",
    mp_webhook_secret: "",
    monthly_price: "",
    semiannual_price: "",
    annual_price: "",
    commission_percentage: "10"
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings/payment`);
      setConfig(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validações
      if (config.mp_public_key && !config.mp_public_key.startsWith('APP_USR')) {
        toast.error("Public Key deve começar com APP_USR");
        setSaving(false);
        return;
      }

      if (config.commission_percentage) {
        const commission = parseFloat(config.commission_percentage);
        if (commission < 0 || commission > 100) {
          toast.error("Comissão deve estar entre 0 e 100");
          setSaving(false);
          return;
        }
      }

      await axios.post(`${API}/settings/payment`, config);
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.detail || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mercado Pago Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <CardTitle>Configurações do Mercado Pago</CardTitle>
          </div>
          <CardDescription>
            Configure as credenciais de API do Mercado Pago para processar pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mp_public_key">Public Key</Label>
            <div className="relative">
              <Input
                id="mp_public_key"
                type={showTokens ? "text" : "password"}
                placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={config.mp_public_key}
                onChange={(e) => handleChange('mp_public_key', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowTokens(!showTokens)}
              >
                {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Public Key usado no frontend para tokenização de cartões
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mp_access_token">Access Token</Label>
            <Input
              id="mp_access_token"
              type={showTokens ? "text" : "password"}
              placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={config.mp_access_token}
              onChange={(e) => handleChange('mp_access_token', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Access Token usado no backend para processar pagamentos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mp_webhook_secret">Webhook Secret</Label>
            <Input
              id="mp_webhook_secret"
              type={showTokens ? "text" : "password"}
              placeholder="Secret para validar webhooks"
              value={config.mp_webhook_secret}
              onChange={(e) => handleChange('mp_webhook_secret', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Secret usado para validar notificações de pagamento (webhook)
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-medium mb-2">
              📘 Como obter suas credenciais:
            </p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Acesse <strong>mercadopago.com</strong> e faça login</li>
              <li>Vá em <strong>Seu negócio → Configurações → Credenciais</strong></li>
              <li>Copie a <strong>Public Key</strong> e o <strong>Access Token</strong></li>
              <li>Use credenciais de <strong>Produção</strong> para ambiente real</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <CardTitle>Valores dos Planos de Licença</CardTitle>
          </div>
          <CardDescription>
            Defina os valores que as empresas pagarão por período de licença
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_price">Plano Mensal (R$)</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                placeholder="99.90"
                value={config.monthly_price}
                onChange={(e) => handleChange('monthly_price', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semiannual_price">Plano Semestral (R$)</Label>
              <Input
                id="semiannual_price"
                type="number"
                step="0.01"
                placeholder="499.00"
                value={config.semiannual_price}
                onChange={(e) => handleChange('semiannual_price', e.target.value)}
              />
              <p className="text-xs text-gray-500">Opcional</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annual_price">Plano Anual (R$)</Label>
              <Input
                id="annual_price"
                type="number"
                step="0.01"
                placeholder="899.00"
                value={config.annual_price}
                onChange={(e) => handleChange('annual_price', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_percentage">Comissão da Plataforma (%)</Label>
            <Input
              id="commission_percentage"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="10"
              value={config.commission_percentage}
              onChange={(e) => handleChange('commission_percentage', e.target.value)}
              className="w-32"
            />
            <p className="text-xs text-gray-500">
              Porcentagem retida pela plataforma em cada transação
            </p>
          </div>

          {config.monthly_price && config.commission_percentage && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-900 mb-2">Exemplo de Cálculo:</p>
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Plano Mensal:</strong> R$ {parseFloat(config.monthly_price).toFixed(2)}
                </p>
                <p>
                  <strong>Comissão ({config.commission_percentage}%):</strong> R${' '}
                  {(parseFloat(config.monthly_price) * parseFloat(config.commission_percentage) / 100).toFixed(2)}
                </p>
                <p className="text-green-700 font-medium">
                  <strong>Empresa recebe:</strong> R${' '}
                  {(parseFloat(config.monthly_price) * (1 - parseFloat(config.commission_percentage) / 100)).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="px-8"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>

      {/* Status Indicator */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <CardTitle>Status da Integração</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Credenciais do Mercado Pago</span>
              {config.mp_public_key && config.mp_access_token ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  ✓ Configurado
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  ⚠ Pendente
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Valores dos Planos</span>
              {config.monthly_price && config.annual_price ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  ✓ Configurado
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  ⚠ Pendente
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Sistema de Pagamento</span>
              {config.mp_public_key && config.mp_access_token && config.monthly_price ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  ✓ Ativo
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  ✗ Inativo
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsTab;
