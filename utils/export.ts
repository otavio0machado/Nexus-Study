
import { Deck } from '../types';

/**
 * Converte um baralho para formato CSV e dispara o download.
 * Formato: "Frente","Verso" (Compatível com importação padrão do Anki)
 */
export const exportDeckToCSV = (deck: Deck) => {
  if (!deck.cards || deck.cards.length === 0) {
    alert('Este baralho está vazio. Adicione cartas antes de exportar.');
    return;
  }

  // Cabeçalho opcional (Anki geralmente ignora se não mapeado, mas ajuda na leitura)
  // const header = '"Front","Back"\n'; 
  
  // Processa as linhas
  const rows = deck.cards.map(card => {
    // Escapar aspas duplas (substituir " por "") para não quebrar o CSV
    const frontSafe = card.front.replace(/"/g, '""');
    // Para Cloze, o front contém a estrutura {{c1::...}}, o back costuma ser vazio ou extra.
    // Exportamos o front normalmente.
    const backSafe = (card.back || '').replace(/"/g, '""');

    // Envolve em aspas para permitir vírgulas e quebras de linha dentro do conteúdo
    return `"${frontSafe}","${backSafe}"`;
  });

  const csvContent = rows.join('\n');
  
  // Cria o Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Cria link de download temporário
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Formata nome do arquivo: "NomeDoBaralho_Export.csv"
  const safeTitle = deck.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${safeTitle}_anki_export.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  
  // Limpeza
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
