import React, { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PDFPropertyReport } from '../components/pdf/PDFPropertyReport';
import { Download, FileText, Calendar, Users } from 'lucide-react';
import { normalizeBattalionFileName } from '../utils/fileUtils';

interface Property {
  id: string;
  name: string;
  owner_name?: string;
  owner_phone?: string;
  cidade?: string;
  property_type: string;
  has_cameras?: boolean;
  has_wifi?: boolean;
  created_at: string;
  cadastro_date?: string;
  equipe?: string;
  crpm?: string;
  batalhao?: string;
  cia?: string;
}

interface User {
  id: string;
  nome_guerra: string;
  patente: string;
  crpm: string;
  batalhao: string;
  cia: string;
}

const Reports: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(''); // Deixar vazio para o usuário escolher
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [filterType, setFilterType] = useState<'date-range' | 'month'>('month');
  const [battalionBadgeUrl, setBattalionBadgeUrl] = useState<string | null>(null);
  const [pmprBadgeUrl, setPmprBadgeUrl] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [organizationalScope, setOrganizationalScope] = useState<'my-cia' | 'all-parana' | 'specific-crpm' | 'specific-cia'>('my-cia');
  const [selectedCrpm, setSelectedCrpm] = useState('');
  const [selectedCia, setSelectedCia] = useState('');

  useEffect(() => {
    loadUserData();
    loadProperties();
  }, []);

  useEffect(() => {
    if (user?.batalhao) {
      loadBattalionBadge();
      loadPmprBadge();
    }
  }, [user]);

  useEffect(() => {
    filterPropertiesByDate();
  }, [properties, startDate, endDate, selectedMonth, selectedYear, filterType, organizationalScope, selectedCrpm, selectedCia]);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('properties')
        .select(`
          id, name, owner_name, owner_phone, cidade, property_type, 
          has_cameras, has_wifi, created_at, cadastro_date, equipe,
          crpm, batalhao, cia
        `)
        .order('cadastro_date', { ascending: false });

      if (data) {
        setProperties(data);
      }
    } catch (error) {
      console.error('Erro ao carregar propriedades:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBattalionBadge = async () => {
    if (!user?.batalhao) return;

    try {
      const fileName = normalizeBattalionFileName(user.batalhao);
      console.log('Tentando carregar brasão:', fileName);
      
      const { data } = await supabase.storage
        .from('battalion-badges')
        .getPublicUrl(fileName);

      // Verificar se o arquivo existe
      const response = await fetch(data.publicUrl);
      if (response.ok) {
        setBattalionBadgeUrl(data.publicUrl);
        console.log('Brasão carregado com sucesso:', data.publicUrl);
      } else {
        console.log('Brasão não encontrado para:', fileName);
      }
    } catch (error) {
      console.error('Erro ao carregar brasão do batalhão:', error);
    }
  };

  const loadPmprBadge = async () => {
    try {
      // Tentar carregar brasão PMPR padrão
      const { data } = await supabase.storage
        .from('battalion-badges')
        .getPublicUrl('pmpr.png');

      // Verificar se o arquivo existe
      const response = await fetch(data.publicUrl);
      if (response.ok) {
        setPmprBadgeUrl(data.publicUrl);
        console.log('Brasão PMPR carregado com sucesso:', data.publicUrl);
      } else {
        console.log('Brasão PMPR não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar brasão PMPR:', error);
    }
  };

  const filterPropertiesByDate = () => {
    let filtered = [...properties];

    if (filterType === 'date-range' && startDate && endDate) {
      filtered = properties.filter(property => {
        // Usar cadastro_date se disponível, senão created_at
        const dateToUse = property.cadastro_date || property.created_at;
        const propertyDate = new Date(dateToUse);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return propertyDate >= start && propertyDate <= end;
      });
    } else if (filterType === 'month' && selectedMonth && selectedYear) {
      filtered = properties.filter(property => {
        // Usar cadastro_date se disponível, senão created_at
        const dateToUse = property.cadastro_date || property.created_at;
        const propertyDate = new Date(dateToUse);
        const month = (propertyDate.getMonth() + 1).toString().padStart(2, '0');
        const year = propertyDate.getFullYear().toString();
        return month === selectedMonth && year === selectedYear;
      });
    }

    // Aplicar filtro organizacional
    if (user) {
      filtered = filtered.filter(property => {
        switch (organizationalScope) {
          case 'my-cia':
            return property.cia === user.cia;
          case 'all-parana':
            return true; // Mostrar todas as propriedades do Paraná
          case 'specific-crpm':
            return selectedCrpm ? property.crpm === selectedCrpm : true;
          case 'specific-cia':
            return selectedCia ? property.cia === selectedCia : true;
          default:
            return true;
        }
      });
    }

    console.log(`Filtro aplicado: ${filterType === 'month' ? `${selectedMonth}/${selectedYear}` : `${startDate} a ${endDate}`}`);
    console.log(`Filtro organizacional: ${organizationalScope}`);
    console.log(`Total de propriedades: ${properties.length}, Filtradas: ${filtered.length}`);

    setFilteredProperties(filtered);
  };

  const generatePDF = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let reportTitle = 'RELATÓRIO DE PRODUÇÃO PATRULHA RURAL';
      let dateRange = '';

      if (filterType === 'date-range' && startDate && endDate) {
        const start = new Date(startDate).toLocaleDateString('pt-BR');
        const end = new Date(endDate).toLocaleDateString('pt-BR');
        dateRange = `${start} a ${end}`;
      } else if (filterType === 'month' && selectedMonth && selectedYear) {
        const monthNames = [
          'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
          'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
        ];
        const monthName = monthNames[parseInt(selectedMonth) - 1];
        dateRange = `${monthName}/${selectedYear}`;
      }

      const userInfo = {
        name: user.nome_guerra || user.full_name,
        patente: user.patente || 'N/A',
        crpm: user.crpm || '2º COMANDO REGIONAL DE POLÍCIA MILITAR',
        batalhao: user.batalhao || '2º BATALHÃO DE POLÍCIA MILITAR',
        cia: user.cia || 'N/A',
      };

      const pdfDoc = (
        <PDFPropertyReport
          properties={filteredProperties}
          reportTitle={reportTitle}
          dateRange={dateRange}
          userInfo={userInfo}
          battalionBadgeUrl={battalionBadgeUrl}
          pmprBadgeUrl={pmprBadgeUrl}
        />
      );

      const blob = await pdf(pdfDoc).toBlob();
      const fileName = `PMPR_Relatorio_Propriedades_${dateRange.replace(/\//g, '_')}_${user.cia}.pdf`;
      saveAs(blob, fileName);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar relatório PDF');
    } finally {
      setLoading(false);
    }
  };

  const monthOptions = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando dados do usuário...</div>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Relatórios
        </h1>
        <p className="text-gray-600">
          Gere relatórios de produtividade da Patrulha Rural Comunitária
        </p>
      </div>

      <div className="grid gap-6">
        {/* Filtros */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros do Relatório
          </h2>

          <div className="space-y-4">
            {/* Tipo de Filtro */}
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Período</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="month"
                    checked={filterType === 'month'}
                    onChange={(e) => setFilterType(e.target.value as 'month')}
                    className="mr-2"
                  />
                  Mês/Ano
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="date-range"
                    checked={filterType === 'date-range'}
                    onChange={(e) => setFilterType(e.target.value as 'date-range')}
                    className="mr-2"
                  />
                  Período Personalizado
                </label>
              </div>
            </div>

            {/* Filtro Organizacional */}
            <div>
              <label className="block text-sm font-medium mb-2">Escopo Organizacional</label>
              
              {/* Filtro Padrão */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Minha CIA</h3>
                    <p className="text-sm text-blue-700">{user?.cia} - {user?.batalhao} - {user?.crpm}</p>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredProperties.length}
                  </div>
                </div>
              </div>

              {/* Botão para Outra Unidade */}
              <div className="flex justify-center mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAdvancedFilters(!showAdvancedFilters);
                    if (!showAdvancedFilters) {
                      // Reset ao abrir filtros avançados
                      setOrganizationalScope('my-cia');
                      setSelectedCrpm('');
                      setSelectedCia('');
                    }
                  }}
                  className="w-full"
                >
                  {showAdvancedFilters ? 'Usar Minha CIA' : 'Outra Unidade'}
                </Button>
              </div>

              {/* Filtros Avançados */}
              {showAdvancedFilters && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Selecione o Escopo</label>
                    <select
                      value={organizationalScope}
                      onChange={(e) => {
                        setOrganizationalScope(e.target.value as any);
                        // Reset campos dependentes
                        setSelectedCrpm('');
                        setSelectedCia('');
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="my-cia">Minha CIA ({user?.cia})</option>
                      <option value="all-parana">Todo o Paraná (Todos os CRPMs)</option>
                      <option value="specific-crpm">CRPM Específico</option>
                      <option value="specific-cia">CIA Específica</option>
                    </select>
                  </div>

                  {/* Seleção de CRPM */}
                  {organizationalScope === 'specific-crpm' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Selecione o CRPM</label>
                      <select
                        value={selectedCrpm}
                        onChange={(e) => setSelectedCrpm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Selecione um CRPM</option>
                        <option value="1º COMANDO REGIONAL DE POLÍCIA MILITAR">1º CRPM</option>
                        <option value="2º COMANDO REGIONAL DE POLÍCIA MILITAR">2º CRPM</option>
                        <option value="3º COMANDO REGIONAL DE POLÍCIA MILITAR">3º CRPM</option>
                        <option value="4º COMANDO REGIONAL DE POLÍCIA MILITAR">4º CRPM</option>
                        <option value="5º COMANDO REGIONAL DE POLÍCIA MILITAR">5º CRPM</option>
                      </select>
                    </div>
                  )}

                  {/* Seleção de CIA */}
                  {organizationalScope === 'specific-cia' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Primeiro selecione o CRPM</label>
                        <select
                          value={selectedCrpm}
                          onChange={(e) => {
                            setSelectedCrpm(e.target.value);
                            setSelectedCia(''); // Reset CIA quando muda CRPM
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Selecione um CRPM</option>
                          <option value="1º COMANDO REGIONAL DE POLÍCIA MILITAR">1º CRPM</option>
                          <option value="2º COMANDO REGIONAL DE POLÍCIA MILITAR">2º CRPM</option>
                          <option value="3º COMANDO REGIONAL DE POLÍCIA MILITAR">3º CRPM</option>
                          <option value="4º COMANDO REGIONAL DE POLÍCIA MILITAR">4º CRPM</option>
                          <option value="5º COMANDO REGIONAL DE POLÍCIA MILITAR">5º CRPM</option>
                        </select>
                      </div>

                      {selectedCrpm && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Agora selecione a CIA</label>
                          <select
                            value={selectedCia}
                            onChange={(e) => setSelectedCia(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Selecione uma CIA</option>
                            <option value="1ª CIA">1ª CIA</option>
                            <option value="2ª CIA">2ª CIA</option>
                            <option value="3ª CIA">3ª CIA</option>
                            <option value="4ª CIA">4ª CIA</option>
                            <option value="5ª CIA">5ª CIA</option>
                            <option value="6ª CIA">6ª CIA</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Indicador Visual do Filtro Ativo */}
                  {showAdvancedFilters && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Filtro Ativo:</p>
                      <p className="text-sm text-gray-600">
                        {organizationalScope === 'my-cia' && `${user?.cia} - ${user?.batalhao} - ${user?.crpm}`}
                        {organizationalScope === 'all-parana' && 'Todo o Estado do Paraná'}
                        {organizationalScope === 'specific-crpm' && selectedCrpm && `${selectedCrpm}`}
                        {organizationalScope === 'specific-cia' && selectedCia && selectedCrpm && `${selectedCia} - ${selectedCrpm}`}
                        {organizationalScope === 'specific-crpm' && !selectedCrpm && 'Selecione um CRPM'}
                        {organizationalScope === 'specific-cia' && (!selectedCrpm || !selectedCia) && 'Selecione CRPM e CIA'}
                      </p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        {filteredProperties.length} propriedades
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filtros de Data */}
            {filterType === 'month' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Mês</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione um mês</option>
                    {monthOptions.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ano</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data Início</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data Fim</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Prévia do Relatório */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Prévia do Relatório
          </h2>

          <div className="space-y-4">
            {!showAdvancedFilters && (
              <div className="flex justify-center">
                <div className="bg-blue-50 p-6 rounded-lg text-center min-w-[200px]">
                  <div className="text-3xl font-bold text-blue-600">{filteredProperties.length}</div>
                  <div className="text-sm text-gray-600">Total de Propriedades Cadastradas</div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={generatePDF}
                disabled={loading || filteredProperties.length === 0 || 
                  (organizationalScope === 'specific-crpm' && !selectedCrpm) ||
                  (organizationalScope === 'specific-cia' && (!selectedCrpm || !selectedCia))
                }
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {loading ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
              </Button>
            </div>

            {/* Mensagem quando filtro está incompleto */}
            {((organizationalScope === 'specific-crpm' && !selectedCrpm) ||
              (organizationalScope === 'specific-cia' && (!selectedCrpm || !selectedCia))) && (
              <div className="text-center text-sm text-gray-500">
                Complete a seleção de unidade para gerar o relatório
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;