
import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Save, AlertCircle, Search, Link as LinkIcon, Plus } from 'lucide-react';
import { Note, PDFAnnotation } from '@/types';
import { useStorage } from '@/contexts/StorageContext';
import { useAnnotationService } from '@/services/annotationService';
import { QuickCardModal } from '@/components/integration/QuickCardModal';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { formatCitation } from '@/utils/citation';
import { api } from '@/services/api';

export const PDFStudy: React.FC = () => {
    const { state, saveNote } = useStorage();
    const { saveAnnotation } = useAnnotationService();
    
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [sideNote, setSideNote] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Integration State
    const [showQuickCard, setShowQuickCard] = useState(false);
    const [showNoteLinkModal, setShowNoteLinkModal] = useState(false);
    
    const [selectionText, setSelectionText] = useState('');
    const [selectionPage, setSelectionPage] = useState(1);
    const [searchNoteQuery, setSearchNoteQuery] = useState('');

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

    const handlePDFSelection = (text: string, page: number) => {
        setSelectionText(text);
        setSelectionPage(page);
        setShowQuickCard(true);
        
        const citation = formatCitation({
            text,
            title: fileName || 'Doc',
            page,
            format: 'RAW'
        });
        
        setSideNote(prev => prev + `\n\n${citation}`);
    };

    const handleLinkRequest = (text: string, page: number) => {
        setSelectionText(text);
        setSelectionPage(page);
        setSearchNoteQuery('');
        setShowNoteLinkModal(true);
    };

    const handleLinkToNote = (note: Note | null) => {
        if (!pdfUrl) return;

        let noteId = note?.id;
        let noteTitle = note?.title;

        // Se criar nova nota
        if (!note) {
             const newTitle = `Nota sobre: ${selectionText.substring(0, 20)}...`;
             const newNote: Note = {
                id: Date.now().toString(),
                title: newTitle,
                content: `# ${newTitle}\n\n> ${selectionText}`,
                createdAt: Date.now(),
                updatedAt: Date.now()
             };
             saveNote(newNote);
             noteId = newNote.id;
             noteTitle = newNote.title;
        }

        if (noteId) {
            const annotation: PDFAnnotation = {
                id: crypto.randomUUID(),
                userId: 'current_user',
                pdfId: pdfUrl,
                page: selectionPage,
                text: selectionText,
                bbox: { x: 0, y: 0, width: 0, height: 0 },
                color: '#8b5cf6', // Purple for links
                type: 'highlight',
                noteId: noteId,
                comment: `Vinculado a: ${noteTitle}`,
                createdAt: new Date().toISOString()
            };
            
            saveAnnotation(annotation);
            api.annotations.create(annotation);
            alert(`Trecho vinculado à nota "${noteTitle}"!`);
        }
        
        setShowNoteLinkModal(false);
    };

    const filteredNotes = state.notes.filter(n => 
        n.title.toLowerCase().includes(searchNoteQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col animate-fade-in relative">
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
                                onLinkRequest={handleLinkRequest}
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

            {/* Modal para Vincular Nota */}
            {showNoteLinkModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <LinkIcon size={20} className="text-purple-400" /> Vincular à Nota
                            </h2>
                            <button onClick={() => setShowNoteLinkModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                        </div>
                        
                        <div className="relative mb-4">
                            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Buscar notas existentes..." 
                                className="w-full bg-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-nexus-500 border border-slate-700 text-white"
                                value={searchNoteQuery}
                                onChange={e => setSearchNoteQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                            <button 
                                onClick={() => handleLinkToNote(null)}
                                className="w-full text-left p-3 rounded-lg border border-dashed border-slate-700 text-nexus-400 hover:bg-nexus-500/10 hover:border-nexus-500/50 flex items-center gap-2 transition-colors"
                            >
                                <Plus size={16} /> Criar Nova Nota Automática
                            </button>
                            
                            {filteredNotes.length === 0 && searchNoteQuery && (
                                <p className="text-center text-slate-500 text-sm py-4">Nenhuma nota encontrada.</p>
                            )}

                            {filteredNotes.map(note => (
                                <button 
                                    key={note.id}
                                    onClick={() => handleLinkToNote(note)}
                                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors"
                                >
                                    <h4 className="text-sm font-medium text-slate-200">{note.title}</h4>
                                    <p className="text-xs text-slate-500 truncate mt-1">{note.content.substring(0, 40)}...</p>
                                </button>
                            ))}
                        </div>
                        
                        <div className="pt-2 border-t border-white/5 text-center">
                            <span className="text-xs text-slate-500">Selecionando: "{selectionText.substring(0, 30)}..."</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
