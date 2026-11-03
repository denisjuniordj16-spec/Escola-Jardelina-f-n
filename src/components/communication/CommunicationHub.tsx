import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Announcement, AnnouncementCategory, AnnouncementPriority } from '../../types';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Mic,
  Send,
  Plus,
  Trash2,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CompanyEmblem } from '../common/CompanyEmblem';

export const CommunicationHub: React.FC = () => {
  const {
    announcements,
    speechState,
    speakText,
    stopSpeech,
    pauseSpeech,
    resumeSpeech,
    setSpeechRate,
    addAnnouncement,
    deleteAnnouncement,
    companySettings,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [quickSpeechText, setQuickSpeechText] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Announcement Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<AnnouncementCategory>('GERAL');
  const [newPriority, setNewPriority] = useState<AnnouncementPriority>('NORMAL');
  const [newAuthor, setNewAuthor] = useState('Diretoria Executiva');

  const filteredAnnouncements = announcements.filter((a) => {
    if (selectedCategory === 'TODOS') return true;
    return a.category === selectedCategory;
  });

  const handleSpeakAnnouncement = (ann: Announcement) => {
    // If currently speaking this announcement, stop it
    if (speechState.isSpeaking && speechState.currentText?.includes(ann.title)) {
      stopSpeech();
      return;
    }
    const fullSpeech = `Comunicado: ${ann.title}. Mensagem: ${ann.content}. Publicado por: ${ann.author}.`;
    speakText(fullSpeech, true);
  };

  const handleQuickSpeak = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSpeechText.trim()) return;
    speakText(quickSpeechText.trim(), true);
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    addAnnouncement({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      priority: newPriority,
      author: newAuthor.trim() || 'Diretoria Geral',
    });

    setNewTitle('');
    setNewContent('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* System Header / Pitch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <CompanyEmblem settings={companySettings} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                {companySettings.name}
              </span>
              <span className="text-xs text-slate-400">· Voz Sintetizada pt-BR</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
              1. Central de Comunicação Institucional
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transmissão de comunicados oficiais e ordens com leitura em voz alta sintetizada para todos os setores.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap self-start md:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Comunicado</span>
        </button>
      </div>

      {/* TTS Live Audio Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${
              speechState.isSpeaking
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Sistema de Áudio & Sintetizador de Voz (TTS)
                </span>
                {speechState.isSpeaking && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    · Reproduzindo
                  </span>
                )}
                {speechState.isPaused && (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    · Pausado
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-xl">
                {speechState.currentText
                  ? speechState.currentText
                  : 'Nenhum áudio em reprodução. Clique em "Ouvir em Voz Alta" em qualquer comunicado abaixo.'}
              </p>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto justify-end">
            {speechState.isSpeaking && !speechState.isPaused && (
              <button
                onClick={pauseSpeech}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pausar</span>
              </button>
            )}

            {speechState.isPaused && (
              <button
                onClick={resumeSpeech}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Continuar</span>
              </button>
            )}

            {speechState.isSpeaking && (
              <button
                onClick={stopSpeech}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Parar Áudio</span>
              </button>
            )}

            {/* Speech Rate Controls */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 rounded-md text-xs">
              <span className="px-2 text-slate-400 font-medium">Velocidade:</span>
              {[0.8, 1.0, 1.2, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-1 rounded transition-colors ${
                    speechState.rate === rate
                      ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Speaker / Anunciador da Portaria (Interfone) */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Anunciador Imediato de Portaria (Interfone / Alto-falante)
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto hidden sm:inline">
            Toca gongo sonoro e lê em voz alta imediatamente
          </span>
        </div>

        <form onSubmit={handleQuickSpeak} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={quickSpeechText}
            onChange={(e) => setQuickSpeechText(e.target.value)}
            placeholder="Digite qualquer mensagem para ser falada no alto-falante (ex: Atenção, motorista do caminhão 4 comparecer à portaria)..."
            className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!quickSpeechText.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Volume2 className="w-4 h-4" />
            <span>Falar no Alto-falante</span>
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          {['TODOS', 'GERAL', 'PORTARIA', 'DIRECAO', 'RH'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedCategory === cat
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'TODOS' ? 'Todos os Comunicados' : cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Mostrando {filteredAnnouncements.length} comunicados disponíveis
        </span>
      </div>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnnouncements.map((ann) => {
          const isCurrentlyPlaying =
            speechState.isSpeaking && speechState.currentText?.includes(ann.title);

          return (
            <article
              key={ann.id}
              className={`p-5 rounded-xl border transition-all ${
                isCurrentlyPlaying
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Card Meta Kicker - Clean unboxed metadata with separators (Anti-Slop) */}
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {ann.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{ann.dateFormatted}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ann.timeFormatted}</span>
                  {ann.priority === 'URGENTE' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        Prioridade Urgente
                      </span>
                    </>
                  )}
                </div>

                <button
                  onClick={() => deleteAnnouncement(ann.id)}
                  title="Remover comunicado"
                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                {ann.title}
              </h3>

              {/* Body */}
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {ann.content}
              </p>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  Por {ann.author}
                </span>

                <button
                  onClick={() => handleSpeakAnnouncement(ann)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-xs ${
                    isCurrentlyPlaying
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Parar Leitura</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Ouvir em Voz Alta</span>
                    </>
                  )}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal for creating announcement */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Publicar Novo Comunicado Institucional
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Este comunicado poderá ser lido em áudio sintetizado em qualquer tela da organização.
            </p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título do Comunicado
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Treinamento de segurança nesta sexta-feira"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AnnouncementCategory)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="GERAL">Geral</option>
                    <option value="PORTARIA">Portaria</option>
                    <option value="DIRECAO">Direção</option>
                    <option value="RH">Recursos Humanos</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as AnnouncementPriority)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANTE">Importante</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Autor / Setor Emissor
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Ex: Coordenação Geral"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Texto Completo (Será lido pela voz do sistema)
                </label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Digite o texto detalhado da instrução ou aviso..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                >
                  Salvar e Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
