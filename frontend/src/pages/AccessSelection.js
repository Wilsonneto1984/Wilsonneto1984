import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Shield, ArrowRight, Plus } from "lucide-react";

function AccessSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Sistema de Controle de Efetivo
          </h1>
          <p className="text-lg text-gray-600">
            Selecione como deseja acessar o sistema
          </p>
        </div>

        {/* Access Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Opção 1: Empresa */}
          <Card 
            className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 group"
            onClick={() => navigate('/login/empresa')}
          >
            <CardHeader className="text-center pb-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl mx-auto w-24 h-24 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Building2 className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl">Acessar como Empresa</CardTitle>
              <CardDescription className="text-base mt-3">
                Área para gestores e visualizadores de empresas cadastradas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-2">Funcionalidades:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Gerenciar colaboradores</li>
                  <li>• Controlar presença e turnos</li>
                  <li>• Visualizar relatórios</li>
                  <li>• Exportar dados</li>
                </ul>
              </div>
              
              <Button 
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/login/empresa');
                }}
              >
                Continuar como Empresa
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Opção 2: Gestor da Plataforma */}
          <Card 
            className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-purple-500 group"
            onClick={() => navigate('/login/admin')}
          >
            <CardHeader className="text-center pb-4">
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-2xl mx-auto w-24 h-24 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl">Gestor da Plataforma</CardTitle>
              <CardDescription className="text-base mt-3">
                Área administrativa para gestão de todas as empresas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-900 font-medium mb-2">Funcionalidades:</p>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Criar e gerenciar empresas</li>
                  <li>• Controlar assinaturas</li>
                  <li>• Gerenciar usuários</li>
                  <li>• Configurações da plataforma</li>
                </ul>
              </div>
              
              <Button 
                className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/login/admin');
                }}
              >
                Continuar como Gestor
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 space-y-4">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <p className="text-gray-700 font-medium mb-3">
              Ainda não tem uma conta?
            </p>
            <Button
              onClick={() => navigate('/register')}
              size="lg"
              variant="outline"
              className="bg-white hover:bg-blue-50 border-2 border-blue-600 text-blue-600 font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Cadastrar Nova Empresa (30 dias grátis)
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            Sistema de Gerenciamento Multi-Empresa • Versão 1.0
          </p>
        </div>
      </div>
    </div>
  );
}

export default AccessSelection;
