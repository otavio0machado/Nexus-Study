
import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Save, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { Note } from '../types';
import { useStorage } from '../contexts/StorageContext';
import { QuickCardModal } from '../components/integration/QuickCardModal';

export const PDFStudy: React.FC = () => {
    const { saveNote } = useStorage();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [sideNote, setSideNote] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Integration State
    const [showQuickCard, setShowQuickCard] = useState(false);
    const [selectionText, setSelectionText] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            const url = URL.createObjectURL(file);
            setPdfUrl(url);
            setFileName(file.name);
            setSideNote(`# Estudo: ${file.name}\n\n## Anotações\n- `);
        }
    };

    const handleSaveNote = () => {
        if(!sideNote) return;
        const newNote: Note = {
            id: Date.now().toString(),
            title: `PDF: ${fileName || 'Documento'}`,
            content: sideNote,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        saveNote(newNote);
        alert('Nota salva em Conexões! Você pode visualizá-la no menu Conexões.');
    };

    const handleCreateFlashcard = () => {
        // Tenta pegar seleção do textarea de notas
        const textarea = document.getElementById('pdf-notes') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            if (start !== end) {
                setSelectionText(textarea.value.substring(start, end));
            } else {
                setSelectionText('');
            }
        }
        setShowQuickCard(true);
    };

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {!pdfUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center glass-panel rounded-2xl border border-dashed border-slate-700 m-4 hover:border-nexus-500/50 transition-colors">
                    <div className="bg-slate-800 p-6 rounded-full mb-4 shadow-xl">
                        <Upload size={48} className="text-nexus-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Carregar Material</h2>
                    <p className="text-slate-400 mb-6 max-w-md text-center">
                        Selecione um arquivo PDF (provas antigas, apostilas, resumos) para estudar com anotações simultâneas.
                    </p>
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-8 py-3 bg-nexus-600 hover:bg-nexus-500 text-white rounded-xl font-medium shadow-lg shadow-nexus-600/20 transition-all transform hover:-translate-y-1"
                    >
                        Selecionar PDF do Computador
                    </button>
                    <p className="mt-4 text-xs text-slate-600">
                        <AlertCircle size={12} className="inline mr-1" />
                        O arquivo é processado apenas localmente no seu navegador.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row h-full gap-4">
                    {/* PDF Viewer */}
                    <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col h-full">
                        <div className="p-3 bg-slate-900 border-b border-white/5 flex justify-between items-center">
                            <span className="text-sm font-medium flex items-center gap-2 text-slate-300">
                                <FileText size={16} /> {fileName}
                            </span>
                            <div className="flex items-center gap-2">
                                <a 
                                    href={pdfUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1 text-slate-500 hover:text-white transition-colors"
                                    title="Abrir em nova aba"
                                >
                                    <ExternalLink size={18} />
                                </a>
                                <button onClick={() => setPdfUrl(null)} className="p-1 text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-800 relative w-full h-full">
                            <object 
                                data={pdfUrl} 
                                type="application/pdf" 
                                className="w-full h-full block"
                            >
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                                    <p className="mb-4">Este navegador não suporta visualização direta de PDFs.</p>
                                    <a 
                                        href={pdfUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="px-4 py-2 bg-nexus-600 text-white rounded-lg hover:bg-nexus-500"
                                    >
                                        Clique aqui para abrir o arquivo
                                    </a>
                                </div>
                            </object>
                        </div>
                    </div>

                    {/* Side Note */}
                    <div className="w-full md:w-96 glass-panel rounded-xl flex flex-col h-1/3 md:h-full">
                        <div className="p-3 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-slate-200">Anotações do Arquivo</h3>
                            <button 
                                onClick={handleCreateFlashcard}
                                className="text-xs flex items-center gap-1 bg-nexus-600/20 text-nexus-300 px-2 py-1 rounded hover:bg-nexus-600/40"
                            >
                                <Zap size={12} /> Criar Card
                            </button>
                        </div>
                        <textarea 
                            id="pdf-notes"
                            className="flex-1 bg-transparent p-4 resize-none outline-none font-mono text-sm leading-relaxed text-slate-300 placeholder-slate-600"
                            placeholder="Faça anotações aqui... Selecione o texto e clique em 'Criar Card' para gerar um flashcard."
                            value={sideNote}
                            onChange={(e) => setSideNote(e.target.value)}
                        />
                        <div className="p-3 border-t border-white/5">
                            <button onClick={handleSaveNote} className="w-full py-2 bg-nexus-600/20 hover:bg-nexus-600/40 text-nexus-300 border border-nexus-500/30 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                <Save size={14} /> Salvar como Nota
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {showQuickCard && fileName && (
                <QuickCardModal
                    initialText={selectionText}
                    sourceType="pdf"
                    sourceId={fileName} // Usando nome do arquivo como ID simplificado
                    sourceTitle={fileName}
                    onClose={() => setShowQuickCard(false)}
                />
            )}
        </div>
    );
};
