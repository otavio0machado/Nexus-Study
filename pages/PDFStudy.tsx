import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Save, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { Note } from '../types';
import { useStorage } from '../contexts/StorageContext';
import { QuickCardModal } from '../components/integration/QuickCardModal';
import { PDFViewer } from '../components/pdf/PDFViewer';
import { formatCitation } from '../utils/citation';

export const PDFStudy: React.FC = () => {
    const { saveNote } = useStorage();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [sideNote, setSideNote] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Integration State
    const [showQuickCard, setShowQuickCard] = useState(false);
    const [selectionText, setSelectionText] = useState('');
    const [selectionPage, setSelectionPage] = useState(1);

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

    // Callback when user selects "Flashcard" or "Note" from the PDF Selection Toolbar
    const handlePDFSelection = (text: string, page: number) => {
        setSelectionText(text);
        setSelectionPage(page);
        
        // We can differentiate behavior here, but for now we default to showing QuickCard
        // or updating the side note.
        // Let's create a visual choice or just use the QuickCard for flashcards
        // and manually append to SideNote for notes.
        
        // If the intent is Flashcard (triggered by toolbar button in PDFViewer which sets this state)
        setShowQuickCard(true);
        
        // Also auto-append citation to notes if desired, or let user do it manually
        const citation = formatCitation({
            text,
            title: fileName || 'Doc',
            page,
            format: 'RAW'
        });
        
        // Append to side note automatically as a "draft"
        setSideNote(prev => prev + `\n\n${citation}`);
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
                        Selecione um arquivo PDF (provas, apostilas, resumos) para estudar com anotações e flashcards integrados.
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
                        Selecionar PDF
                    </button>
                    <p className="mt-4 text-xs text-slate-600">
                        <AlertCircle size={12} className="inline mr-1" />
                        Processamento local seguro.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row h-full gap-4">
                    {/* PDF Viewer Container */}
                    <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col h-full relative z-0">
                        <div className="p-3 bg-slate-900 border-b border-white/5 flex justify-between items-center z-10">
                            <span className="text-sm font-medium flex items-center gap-2 text-slate-300 truncate max-w-[200px]">
                                <FileText size={16} /> {fileName}
                            </span>
                            <button onClick={() => setPdfUrl(null)} className="p-1 text-slate-500 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="flex-1 relative w-full h-full bg-slate-950">
                            <PDFViewer 
                                src={pdfUrl} 
                                title={fileName || 'Documento'}
                                onSelection={handlePDFSelection}
                            />
                        </div>
                    </div>

                    {/* Side Note Panel */}
                    <div className="w-full md:w-96 glass-panel rounded-xl flex flex-col h-1/3 md:h-full z-10">
                        <div className="p-3 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-slate-200">Caderno de Anotações</h3>
                        </div>
                        <textarea 
                            id="pdf-notes"
                            className="flex-1 bg-transparent p-4 resize-none outline-none font-mono text-sm leading-relaxed text-slate-300 placeholder-slate-600 focus:bg-slate-900/30 transition-colors"
                            placeholder="Suas notas aparecem aqui..."
                            value={sideNote}
                            onChange={(e) => setSideNote(e.target.value)}
                        />
                        <div className="p-3 border-t border-white/5">
                            <button onClick={handleSaveNote} className="w-full py-2 bg-nexus-600/20 hover:bg-nexus-600/40 text-nexus-300 border border-nexus-500/30 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                                <Save size={14} /> Salvar em Conexões
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {showQuickCard && fileName && (
                <QuickCardModal
                    initialText={selectionText}
                    sourceType="pdf"
                    sourceId={fileName} 
                    sourceTitle={`${fileName} (Pág ${selectionPage})`}
                    onClose={() => setShowQuickCard(false)}
                />
            )}
        </div>
    );
};