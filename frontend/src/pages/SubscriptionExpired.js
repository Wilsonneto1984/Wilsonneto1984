import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertCircle, CreditCard, Check, Calendar } from "lucide-react";

function SubscriptionExpired({ company, onPaymentSuccess }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/settings/plans`);
      setPlans(response.data.plans);
      if (response.data.plans.length > 0) {
        setSelectedPlan(response.data.plans[0].id);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error("Selecione um plano");
      return;
    }

    setProcessing(true);
    try {
      // TODO: Implementar tokenização do cartão com Mercado Pago
      // Por enquanto, simular pagamento
      
      const response = await axios.post(`${API}/payments/license`, {
        company_id: company.id,
        plan_type: selectedPlan,
        payment_method: "credit_card",
        payer_email: company.admin_email || "admin@empresa.com",
        payer_name: company.name
      });

      toast.success("Pagamento aprovado! Seu acesso foi renovado 🎉");
      
      // Callback para recarregar dados
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.detail || "Erro ao processar pagamento");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const expirationDate = company?.subscription_expires_at 
    ? new Date(company.subscription_expires_at).toLocaleDateString('pt-BR')
    : 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Alert Banner */}
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="bg-red-600 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-900 mb-2">
                  Assinatura Expirada
                </h2>
                <p className="text-red-700">
                  Sua assinatura expirou em <strong>{expirationDate}</strong>. 
                  Renove agora para continuar usando o sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-center mb-6">
            Escolha seu Plano
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const discount = plan.id === 'annual' ? '2 meses grátis!' : 
                               plan.id === 'semiannual' ? '1 mês grátis!' : null;
              
              return (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-600 border-2 shadow-lg' 
                      : 'hover:border-blue-300'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      {discount && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {discount}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-blue-600">
                        R$ {plan.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        por {plan.duration}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <span>Funcionários ilimitados</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <span>Controle de presença</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <span>Relatórios completos</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <span>Exportação Excel/PDF</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-4 p-2 bg-blue-50 rounded text-center">
                        <span className="text-sm font-medium text-blue-900">
                          ✓ Plano Selecionado
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {plans.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  Os planos ainda não foram configurados. 
                  Entre em contato com o administrador da plataforma.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment Button */}
        {plans.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Após o pagamento, seu acesso será renovado imediatamente
                </p>
                
                <Button
                  size="lg"
                  onClick={handlePayment}
                  disabled={!selectedPlan || processing}
                  className="px-12"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando Pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Renovar Assinatura
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 mt-4">
                  Pagamento seguro processado pelo Mercado Pago
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default SubscriptionExpired;
