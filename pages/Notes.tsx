
import React, { useState, useEffect, useRef } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { Note } from '../types';
import * as d3 from 'd3';
import { Network, Plus, Search, Trash2, Eye, Edit2, Zap } from 'lucide-react';
import { QuickCardModal } from '../components/integration/QuickCardModal';

export const Notes: React.FC = () => {
  const { state, saveNote, deleteNote } = useStorage();
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  
  // Integration State
  const [showQuickCard, setShowQuickCard] = useState(false);
  const [selectionText, setSelectionText] = useState('');

  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setIsEditing(false); // Default to read mode when opening a note
    } else {
      setTitle('');
      setContent('');
      setIsEditing(true);
    }
  }, [activeNote?.id]);

  const handleSave = () => {
    if (!title.trim()) return;
    
    const noteToSave: Note = {
      id: activeNote?.id || Date.now().toString(),
      title,
      content,
      createdAt: activeNote?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    saveNote(noteToSave);
    if (!activeNote) setActiveNote(noteToSave);
  };

  const handleCreateNew = () => {
    setActiveNote(null);
    setTitle('');
    setContent('');
    setIsEditing(true);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if(!activeNote) return;
      if(!window.confirm("Tem certeza que deseja apagar esta nota?")) return;
      deleteNote(activeNote.id);
      setActiveNote(null);
  }

  const handleLinkClick = (title: string) => {
    const targetNote = state.notes.find(n => n.title.toLowerCase() === title.toLowerCase());
    if (targetNote) {
      setActiveNote(targetNote);
    } else {
      if(window.confirm(`Nota "${title}" não encontrada. Deseja criar?`)) {
          const newNote: Note = {
              id: Date.now().toString(),
              title: title,
              content: `# ${title}\n\n`,
              createdAt: Date.now(),
              updatedAt: Date.now()
          };
          saveNote(newNote);
          setActiveNote(newNote);
      }
    }
  };

  const handleGenerateCards = () => {
    // Pega o texto da seleção ou todo o conteúdo
    const selection = window.getSelection()?.toString() || content;
    setSelectionText(selection);
    setShowQuickCard(true);
  };

  const filteredNotes = state.notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full md:w-80 flex flex-col glass-panel rounded-xl overflow-hidden h-1/2 md:h-full shrink-0">
        <div className="p-4 border-b border-white/5 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2"><Network size={18} /> Notas</h2>
                <button onClick={handleCreateNew} className="p-2 bg-nexus-600 rounded-lg hover:bg-nexus-500 transition-colors shadow-lg shadow-nexus-600/20">
                    <Plus size={16} />
                </button>
            </div>
            <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Buscar notas..." 
                    className="w-full bg-slate-800 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-nexus-500 transition-all border border-transparent focus:border-nexus-500/50"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredNotes.length === 0 && (
                <div className="text-center p-4 text-slate-500 text-sm">Nenhuma nota encontrada.</div>
            )}
            {filteredNotes.map(note => (
                <div 
                    key={note.id} 
                    onClick={() => setActiveNote(note)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${activeNote?.id === note.id ? 'bg-nexus-900/50 border border-nexus-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                >
                    <h3 className="font-medium truncate text-slate-200">{note.title}</h3>
                    <p className="text-xs text-slate-500 truncate mt-1">
                        {new Date(note.updatedAt).toLocaleDateString()}
                    </p>
                </div>
            ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col glass-panel rounded-xl overflow-hidden h-full relative">
        {!activeNote && !title ? (
            // Graph View when no note selected
            <div className="flex-1 relative bg-slate-900/50">
                <div className="absolute top-4 left-4 z-10 p-3 bg-slate-900/80 rounded-xl backdrop-blur border border-white/5">
                    <h2 className="text-sm font-bold text-slate-300">Grafo de Conhecimento</h2>
                    <p className="text-xs text-slate-500">Visualizando {state.notes.length} conexões</p>
                </div>
                <GraphView notes={state.notes} onNodeClick={setActiveNote} />
            </div>
        ) : (
            // Editor / Viewer
            <div className="flex-1 flex flex-col relative">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/30">
                    <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={handleSave}
                        placeholder="Título da Nota"
                        className="bg-transparent text-xl font-bold focus:outline-none w-full placeholder-slate-600 text-white"
                        readOnly={!isEditing}
                    />
                    <div className="flex items-center gap-2">
                        {/* NOVO: Botão de Gerar Flashcard */}
                        <button 
                            onClick={handleGenerateCards} 
                            className="p-2 rounded text-slate-400 hover:text-nexus-400 hover:bg-white/5"
                            title="Gerar Flashcards (Q: A: ou Seleção)"
                        >
                            <Zap size={18} />
                        </button>
                        <button 
                            onClick={() => {
                                if(isEditing) handleSave();
                                setIsEditing(!isEditing);
                            }} 
                            className={`p-2 rounded text-slate-400 hover:text-white hover:bg-white/5 ${isEditing ? 'text-nexus-400' : ''}`}
                            title={isEditing ? "Ver Preview" : "Editar"}
                        >
                            {isEditing ? <Eye size={18} /> : <Edit2 size={18} />}
                        </button>
                        <button onClick={() => { handleSave(); setActiveNote(null); }} className="p-2 hover:bg-white/5 rounded text-slate-400" title="Ver Grafo">
                            <Network size={18} />
                        </button>
                        <button onClick={handleDelete} className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                
                {isEditing ? (
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        onBlur={handleSave}
                        placeholder="Escreva usando Markdown. Use [[Link]] para conectar notas..."
                        className="flex-1 bg-transparent p-6 focus:outline-none resize-none font-mono text-sm leading-relaxed text-slate-300"
                        autoFocus
                    />
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 prose prose-invert prose-slate max-w-none">
                        <MarkdownPreview content={content} onLinkClick={handleLinkClick} />
                    </div>
                )}
            </div>
        )}
      </div>

      {showQuickCard && activeNote && (
        <QuickCardModal
          initialText={selectionText}
          sourceType="note"
          sourceId={activeNote.id}
          sourceTitle={activeNote.title}
          onClose={() => setShowQuickCard(false)}
        />
      )}
    </div>
  );
};

// Markdown Preview Component that handles [[WikiLinks]]
const MarkdownPreview: React.FC<{ content: string, onLinkClick: (t: string) => void }> = ({ content, onLinkClick }) => {
    const renderContent = () => {
        const parts = content.split(/(\[\[.*?\]\])/g);
        return parts.map((part, index) => {
            if (part.startsWith('[[') && part.endsWith(']]')) {
                const linkText = part.slice(2, -2);
                return (
                    <span 
                        key={index} 
                        onClick={() => onLinkClick(linkText)}
                        className="text-nexus-400 cursor-pointer hover:underline font-medium bg-nexus-900/30 px-1 rounded mx-0.5"
                    >
                        {linkText}
                    </span>
                );
            }
            return <span key={index}>{part}</span>;
        });
    };
    return <div className="whitespace-pre-wrap">{renderContent()}</div>;
};

// D3 Graph Component
const GraphView: React.FC<{ notes: Note[]; onNodeClick: (n: Note) => void }> = ({ notes, onNodeClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || notes.length === 0) return;

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        const nodes = notes.map(n => ({ id: n.title, group: 1, original: n }));
        const links: { source: string; target: string }[] = [];
        
        notes.forEach(sourceNote => {
            const regex = /\[\[(.*?)\]\]/g;
            let match;
            while ((match = regex.exec(sourceNote.content)) !== null) {
                const targetTitle = match[1];
                if (notes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase())) {
                    links.push({ source: sourceNote.title, target: targetTitle });
                }
            }
        });

        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height]);

        const simulation = d3.forceSimulation(nodes as any)
            .force("link", d3.forceLink(links).id((d: any) => d.id).distance(120))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide(30));

        const link = svg.append("g")
            .attr("stroke", "#475569")
            .attr("stroke-opacity", 0.4)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", 1);

        const nodeGroup = svg.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .call(drag(simulation) as any)
            .on("click", (event, d: any) => onNodeClick(d.original))
            .attr("cursor", "pointer");

        nodeGroup.append("circle")
            .attr("r", 8)
            .attr("fill", "#0ea5e9")
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 2);

        nodeGroup.append("text")
            .text((d: any) => d.id)
            .attr("x", 12)
            .attr("y", 4)
            .attr("fill", "#cbd5e1")
            .attr("font-size", "11px")
            .attr("font-family", "Inter")
            .style("pointer-events", "none");

        simulation.on("tick", () => {
            link
                .attr("x1", (d: any) => d.source.x)
                .attr("y1", (d: any) => d.source.y)
                .attr("x2", (d: any) => d.target.x)
                .attr("y2", (d: any) => d.target.y);

            nodeGroup
                .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
        });

        function drag(simulation: any) {
            function dragstarted(event: any) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }

            function dragged(event: any) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }

            function dragended(event: any) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }

            return d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);
        }

        return () => {
            simulation.stop();
        };

    }, [notes]);

    if (notes.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <p>Nenhuma conexão encontrada.</p>
                <p className="text-sm">Crie notas com <span className="text-nexus-400">[[links]]</span> para visualizar o grafo.</p>
            </div>
        );
    }

    return <svg ref={svgRef} className="w-full h-full" />;
};
