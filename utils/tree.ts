
import { Category, Deck } from '../types';

export interface TreeNode {
  id: string;
  type: 'category' | 'deck';
  title: string;
  data?: Deck; // Apenas se type === 'deck'
  parentId?: string;
  children: TreeNode[];
  level: number; // Profundidade para indentação
}

/**
 * Constrói uma árvore hierárquica a partir de listas planas de Categorias e Baralhos.
 */
export const buildDeckTree = (categories: Category[], decks: Deck[]): TreeNode[] => {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // 1. Criar nós para todas as categorias
  categories.forEach(cat => {
    nodeMap.set(cat.id, {
      id: cat.id,
      type: 'category',
      title: cat.name,
      parentId: cat.parentId,
      children: [],
      level: 0
    });
  });

  // 2. Criar nós para baralhos e anexar aos pais (se existirem)
  const uncategorizedDecks: TreeNode[] = [];
  
  decks.forEach(deck => {
    const deckNode: TreeNode = {
      id: deck.id,
      type: 'deck',
      title: deck.title,
      data: deck,
      parentId: deck.categoryId,
      children: [],
      level: 0
    };

    if (deck.categoryId && nodeMap.has(deck.categoryId)) {
      nodeMap.get(deck.categoryId)!.children.push(deckNode);
    } else {
      uncategorizedDecks.push(deckNode);
    }
  });

  // 3. Montar a árvore de categorias (conectar categorias filhas aos pais)
  categories.forEach(cat => {
    const node = nodeMap.get(cat.id)!;
    if (cat.parentId && nodeMap.has(cat.parentId)) {
      nodeMap.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 4. Calcular níveis (profundidade) recursivamente
  const setLevels = (nodes: TreeNode[], level: number) => {
    nodes.forEach(node => {
      node.level = level;
      if (node.children.length > 0) {
        setLevels(node.children, level + 1);
      }
    });
  };

  setLevels(roots, 0);

  // Adicionar baralhos sem categoria à raiz, mas no final
  return [...roots, ...uncategorizedDecks];
};

/**
 * Gera uma lista plana formatada para selects (Ex: "Matemática > Álgebra")
 */
export const getFlattenedCategoryOptions = (categories: Category[]): { id: string, label: string }[] => {
  const options: { id: string, label: string }[] = [];
  const visited = new Set<string>();

  const processCategory = (catId: string, prefix: string) => {
    if (visited.has(catId)) return;
    visited.add(catId);

    const cat = categories.find(c => c.id === catId);
    if (!cat) return;

    const label = prefix ? `${prefix} > ${cat.name}` : cat.name;
    options.push({ id: cat.id, label });

    // Encontrar filhos
    const children = categories.filter(c => c.parentId === catId);
    children.forEach(child => processCategory(child.id, label));
  };

  // Começar pelos que não têm pai (Raiz)
  const roots = categories.filter(c => !c.parentId);
  roots.forEach(root => processCategory(root.id, ''));

  return options;
};
