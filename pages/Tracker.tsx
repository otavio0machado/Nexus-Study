
import React, { useState } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { ExamResult } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Plus, Save, Activity } from 'lucide-react';

export const Tracker: React.FC = () => {
  const { state, addExamResult } = useStorage();
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [type, setType] = useState<'ENEM' | 'UFRGS' | 'SIMULADO'>('SIMULADO');
  const [score, setScore] = useState('');
  const [math, setMath] = useState('');
  const [lang, setLang] = useState('');
  const [nat, setNat] = useState('');
  const [hum, setHum] = useState('');
  const [red, setRed] = useState('');

  const handleAddExam = () => {
      if(!score) return;

      const newExam: ExamResult = {
          id: Date.now().toString(),
          date: Date.now(),
          type,
          score: Number(score),
          maxScore: 1000,
          details: {
              'Matemática': Number(math) || 0,
              'Linguagens': Number(lang) || 0,
              'Natureza': Number(nat) || 0,
              'Humanas': Number(hum) || 0,
              'Redação': Number(red) || 0,
          }
      };
      
      addExamResult(newExam);
      setIsAdding(false);
      setScore(''); setMath(''); setLang(''); setNat(''); setHum(''); setRed('');
  };

  // Prepare chart data
  const historyData = state.examResults
    .sort((a, b) => a.date - b.date)
    .map(e => ({
        date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: e.score,
        type: e.type
    }));

  // Prepare Radar data (Average of last 3 exams)
  const lastExams = [...state.examResults].sort((a,b) => a.date - b.date).slice(-3);
  const subjectAvgs = { 'Matemática': 0, 'Linguagens': 0, 'Natureza': 0, 'Humanas': 0, 'Redação': 0 };
  let count = 0;
  
  lastExams.forEach(e => {
      count++;
      Object.keys(subjectAvgs).forEach(key => {
          subjectAvgs[key as keyof typeof subjectAvgs] += (e.details[key] || 0);
      });
  });

  const radarData = Object.keys(subjectAvgs).map(key => ({
      subject: key,
      A: count > 0 ? Math.round(subjectAvgs[key as keyof typeof subjectAvgs] / count) : 0,
      fullMark: 1000
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Desempenho</h1>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-nexus-600 hover:bg-nexus-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-nexus-600/20">
            <Plus size={18} /> Novo Resultado
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution Chart */}
        <div className="glass-panel p-6 rounded-2xl h-[400px] flex flex-col">
            <div className="mb-4">
                 <h3 className="text-lg font-semibold text-slate-200">Evolução Geral</h3>
                 <p className="text-xs text-slate-400">Histórico de pontuação em simulados e provas.</p>
            </div>
            
            <div className="flex-1 w-full min-h-0">
                {historyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#94a3b8" domain={[0, 1000]} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                                itemStyle={{ color: '#38bdf8' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="score" 
                                stroke="#0ea5e9" 
                                strokeWidth={3} 
                                dot={{ fill: '#0f172a', stroke: '#0ea5e9', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#38bdf8' }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                        <Activity size={32} className="mb-2 opacity-50" />
                        <p>Sem dados suficientes.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Weakness Radar */}
        <div className="glass-panel p-6 rounded-2xl h-[400px] flex flex-col">
             <div className="mb-4">
                 <h3 className="text-lg font-semibold text-slate-200">Radar de Competências</h3>
                 <p className="text-xs text-slate-500">Média das últimas 3 provas.</p>
             </div>
             <div className="flex-1 w-full min-h-0">
                 {historyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 1000]} tick={false} axisLine={false} />
                            <Radar name="Média Recente" dataKey="A" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.3} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                         <Activity size={32} className="mb-2 opacity-50" />
                        <p>Sem dados suficientes.</p>
                    </div>
                 )}
             </div>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
            <h3 className="text-lg font-semibold">Histórico Detalhado</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/5 text-slate-400 text-sm">
                    <tr>
                        <th className="p-4 font-medium">Data</th>
                        <th className="p-4 font-medium">Tipo</th>
                        <th className="p-4 font-medium">Pontuação</th>
                        <th className="p-4 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {state.examResults.sort((a,b) => b.date - a.date).map(exam => (
                        <tr key={exam.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 text-slate-300">{new Date(exam.date).toLocaleDateString()}</td>
                            <td className="p-4">
                                <span className="px-2 py-1 rounded text-xs font-bold bg-slate-700 text-slate-300">
                                    {exam.type}
                                </span>
                            </td>
                            <td className="p-4 font-bold text-white">{exam.score}</td>
                            <td className="p-4">
                                {exam.score > 800 ? (
                                    <span className="text-emerald-400 text-xs font-semibold px-2 py-1 bg-emerald-500/10 rounded-full">Excelente</span>
                                ) : exam.score > 600 ? (
                                    <span className="text-nexus-400 text-xs font-semibold px-2 py-1 bg-nexus-500/10 rounded-full">Bom</span>
                                ) : (
                                    <span className="text-orange-400 text-xs font-semibold px-2 py-1 bg-orange-500/10 rounded-full">Atenção</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {state.examResults.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500">Nenhum registro encontrado.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAdding && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl h-auto max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-6">Registrar Simulado</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                          <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                          <select value={type} onChange={(e: any) => setType(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-1 focus:ring-nexus-500 outline-none">
                              <option value="SIMULADO">Simulado Geral</option>
                              <option value="ENEM">ENEM Oficial</option>
                              <option value="UFRGS">UFRGS Oficial</option>
                          </select>
                      </div>
                       <div>
                          <label className="block text-sm text-slate-400 mb-1">Nota Geral (Média)</label>
                          <input type="number" value={score} onChange={e => setScore(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-1 focus:ring-nexus-500 outline-none" placeholder="Ex: 720" />
                      </div>
                  </div>

                  <h3 className="font-semibold text-slate-300 mb-4 pb-2 border-b border-white/10">Detalhamento por Área</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                       <InputGroup label="Matemática" value={math} onChange={setMath} />
                       <InputGroup label="Linguagens" value={lang} onChange={setLang} />
                       <InputGroup label="Natureza" value={nat} onChange={setNat} />
                       <InputGroup label="Humanas" value={hum} onChange={setHum} />
                       <InputGroup label="Redação" value={red} onChange={setRed} />
                  </div>

                  <div className="flex justify-end gap-3">
                      <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                      <button onClick={handleAddExam} className="px-6 py-2 bg-nexus-600 hover:bg-nexus-500 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-nexus-600/20">
                          <Save size={18} /> Salvar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, value, onChange }: any) => (
    <div>
        <label className="block text-xs uppercase text-slate-500 mb-1">{label}</label>
        <input 
            type="number" 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-1 focus:ring-nexus-500 outline-none" 
        />
    </div>
);
