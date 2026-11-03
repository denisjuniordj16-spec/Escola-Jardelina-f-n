import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanySettings } from '../../types';
import { CompanyEmblem } from './CompanyEmblem';
import {
  Building2,
  Upload,
  Link as LinkIcon,
  Sparkles,
  RotateCcw,
  Check,
  X,
  Image as ImageIcon,
  ShieldCheck,
  Factory,
  Cog,
  Hexagon,
  Globe2,
  Leaf,
  Award,
} from 'lucide-react';

const PRESET_EMBLEMS: {
  id: CompanySettings['emblemPresetId'];
  name: string;
  category: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'shield',
    name: 'Escudo & Segurança',
    category: 'Vigilância / Patrimonial',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  },
  {
    id: 'factory',
    name: 'Planta Industrial',
    category: 'Indústria / Fábrica',
    icon: <Factory className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
  },
  {
    id: 'gear',
    name: 'Engenharia & Mecânica',
    category: 'Manutenção / Usinagem',
    icon: <Cog className="w-5 h-5 text-slate-700 dark:text-slate-300" />,
  },
  {
    id: 'hexagon',
    name: 'Tecnologia & Tech',
    category: 'TI / Logística Ágil',
    icon: <Hexagon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
  },
  {
    id: 'globe',
    name: 'Corporação Global',
    category: 'Multinacional / Comércio',
    icon: <Globe2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
  },
  {
    id: 'building',
    name: 'Sede Corporativa',
    category: 'Edifício / Escritório',
    icon: <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
  },
  {
    id: 'leaf',
    name: 'Sustentabilidade & Agro',
    category: 'Agronegócio / Ecológico',
    icon: <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  },
  {
    id: 'award',
    name: 'Excelência & ISO',
    category: 'Certificação / Qualidade',
    icon: <Award className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
  },
];

export const CompanyBrandingModal: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    resetCompanySettings,
    isCompanyModalOpen,
    setIsCompanyModalOpen,
  } = useApp();

  const [formName, setFormName] = useState(companySettings.name);
  const [formSubtitle, setFormSubtitle] = useState(companySettings.subtitle);
  const [formEmblemType, setFormEmblemType] = useState<CompanySettings['emblemType']>(
    companySettings.emblemType
  );
  const [formPresetId, setFormPresetId] = useState<CompanySettings['emblemPresetId']>(
    companySettings.emblemPresetId
  );
  const [formEmblemUrl, setFormEmblemUrl] = useState(companySettings.emblemUrl);
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCompanyModalOpen) return null;

  // Handle file selection from local device
  const handleFileProcess = (file: File) => {
    setUploadError(null);

    // Validate size (limit ~3MB for localStorage friendly base64)
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 3MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFormEmblemUrl(result);
        setFormEmblemType('custom');
      }
    };
    reader.onerror = () => {
      setUploadError('Erro ao ler a imagem. Tente outro arquivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = formName.trim() || 'Minha Empresa';
    const finalSubtitle = formSubtitle.trim() || 'Portaria & Ponto Eletrônico';

    updateCompanySettings({
      name: finalName,
      subtitle: finalSubtitle,
      emblemType: formEmblemType,
      emblemPresetId: formPresetId,
      emblemUrl: formEmblemUrl.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsCompanyModalOpen(false);
    }, 700);
  };

  const handleResetToDefault = () => {
    resetCompanySettings();
    setFormName('PortaPonto 360 Industrial');
    setFormSubtitle('Unidade Portaria Principal · Turno Oficial 06:00 às 12:00');
    setFormEmblemType('preset');
    setFormPresetId('shield');
    setFormEmblemUrl('');
  };

  // Temporary preview settings
  const previewSettings: CompanySettings = {
    name: formName || 'Nome da Empresa',
    subtitle: formSubtitle || 'Unidade / Subtítulo',
    emblemType: formEmblemType,
    emblemPresetId: formPresetId,
    emblemUrl: formEmblemUrl,
    primaryColor: '#059669',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Personalizar Nome da Empresa & Emblema
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Altere a identidade corporativa exibida no topo, na portaria e nos relatórios.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCompanyModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Live Preview Card */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Pré-visualização em Tempo Real da Identidade
            </span>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <CompanyEmblem settings={previewSettings} size="lg" />
                <div className="min-w-0">
                  <div className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {previewSettings.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {previewSettings.subtitle}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Sistema de Portaria & Ponto Ativo</span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block text-right shrink-0">
                <span className="text-[11px] text-slate-400 font-mono block">Turno Oficial</span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">06:00 às 12:00</span>
              </div>
            </div>
          </div>

          {/* Form Fields: Company Name & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome da Empresa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Indústria Metalúrgica Progresso S.A."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Subtítulo / Unidade / Slogan
              </label>
              <input
                type="text"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                placeholder="Ex: Planta Fabril 01 · Portaria Central"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Emblem Selection Mode Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Selecione o Emblema / Logotipo da Empresa
              </label>
              <span className="text-[11px] text-slate-400">
                {formEmblemType === 'custom' ? 'Emblema Personalizado' : 'Emblema do Sistema'}
              </span>
            </div>

            {/* Sub-tabs for emblem selection */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('presets');
                  setFormEmblemType('preset');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'presets' && formEmblemType === 'preset'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Emblemas do Sistema ({PRESET_EMBLEMS.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  setFormEmblemType('custom');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'upload' || (formEmblemType === 'custom' && activeTab !== 'url')
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                <span>Carregar Imagem (Upload)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('url');
                  setFormEmblemType('custom');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'url'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Link de Imagem (URL)</span>
              </button>
            </div>

            {/* TAB CONTENT: Presets Grid */}
            {activeTab === 'presets' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                {PRESET_EMBLEMS.map((preset) => {
                  const isSelected = formEmblemType === 'preset' && formPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setFormPresetId(preset.id);
                        setFormEmblemType('preset');
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col items-center text-center gap-2 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                        {preset.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {preset.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB CONTENT: Local File Upload */}
            {activeTab === 'upload' && (
              <div className="space-y-3">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Clique para selecionar ou arraste o emblema da sua empresa aqui
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Formatos aceitos: PNG, JPG, SVG, WebP (Até 3MB)
                  </p>
                </div>

                {uploadError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {uploadError}
                  </p>
                )}

                {formEmblemType === 'custom' && formEmblemUrl && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={formEmblemUrl}
                        alt="Emblema carregado"
                        className="w-10 h-10 object-contain rounded-lg bg-white border border-slate-200 p-0.5"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Emblema carregado com sucesso
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormEmblemUrl('');
                        setFormEmblemType('preset');
                        setActiveTab('presets');
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Remover imagem
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Image URL */}
            {activeTab === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Cole o link direto da imagem (URL)
                  </label>
                  <input
                    type="url"
                    value={formEmblemUrl}
                    onChange={(e) => {
                      setFormEmblemUrl(e.target.value);
                      setFormEmblemType('custom');
                    }}
                    placeholder="https://suaempresa.com.br/logo.png"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {formEmblemUrl && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <img
                      src={formEmblemUrl}
                      alt="Prévia do link"
                      className="w-10 h-10 object-contain rounded-lg bg-white border border-slate-200 p-0.5"
                      onError={() => setUploadError('URL inválida ou imagem inacessível.')}
                    />
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Pré-visualização do link inserido
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão do Sistema</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCompanyModalOpen(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Salvo com Sucesso!</span>
                  </>
                ) : (
                  <span>Salvar Nome & Emblema</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
