import { create } from 'zustand';
import type { Recipe, Batch, Tasting, FermentationReading, ParameterDeviation, RecipeComparison, TastingComparison, UserBrewStats, RecipeComment, InventoryItem, InventoryCheckResult, IngredientShortage, IngredientType, BrewStage, BrewPhoto, Equipment, EquipmentType, BrewStep, WaterProfile, WaterAnalysisResult, BeerStyleWaterTarget, MineralCompound } from '../../shared/types.js';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

interface BrewState {
  recipes: Recipe[];
  batches: Batch[];
  calendarBatches: Batch[];
  tastings: Tasting[];
  inventory: InventoryItem[];
  equipment: Equipment[];
  inventoryCheck: InventoryCheckResult | null;
  currentRecipe: Recipe | null;
  currentBatch: Batch | null;
  currentTasting: Tasting | null;
  recipeVersions: Recipe[];
  recipeLineage: Recipe[];
  comparison: RecipeComparison[];
  tastingComparison: TastingComparison[];
  userBrewStats: UserBrewStats | null;
  comments: RecipeComment[];
  loading: boolean;
  error: string | null;
  inventoryShortages: IngredientShortage[];
  inventoryWarnings: InventoryCheckResult['warnings'];
  waterProfiles: WaterProfile[];
  waterAnalysisResult: WaterAnalysisResult | null;
  waterStyleTargets: BeerStyleWaterTarget[];
  mineralCompounds: MineralCompound[];

  fetchRecipes: (params?: { public?: boolean; user?: string }) => Promise<void>;
  fetchRecipeById: (id: string) => Promise<void>;
  fetchRecipeVersions: (id: string) => Promise<void>;
  fetchRecipeLineage: (id: string) => Promise<void>;
  createRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Recipe | null>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<Recipe | null>;
  deleteRecipe: (id: string) => Promise<boolean>;
  createNewVersion: (parentId: string, branchName: string, updates: Partial<Recipe>) => Promise<Recipe | null>;
  forkRecipe: (id: string, createdBy: string) => Promise<Recipe | null>;
  compareRecipes: (idA: string, idB: string) => Promise<void>;

  fetchBatches: (recipeId?: string) => Promise<void>;
  fetchBatchesByDateRange: (startDate: string, endDate: string) => Promise<void>;
  fetchBatchById: (id: string) => Promise<void>;
  createBatchFromRecipe: (recipeId: string, batchData: Omit<Batch, 'id' | 'recipeId' | 'recipeVersion' | 'createdAt' | 'readings' | 'deviations' | 'photos' | 'brewSteps'>) => Promise<{ batch: Batch; warnings: InventoryCheckResult['warnings'] } | null>;
  updateBatch: (id: string, updates: Partial<Batch>) => Promise<Batch | null>;
  deleteBatch: (id: string) => Promise<boolean>;
  addReading: (batchId: string, reading: Omit<FermentationReading, 'id'>) => Promise<Batch | null>;
  updateReading: (batchId: string, readingId: string, updates: Partial<FermentationReading>) => Promise<Batch | null>;
  deleteReading: (batchId: string, readingId: string) => Promise<Batch | null>;
  addDeviation: (batchId: string, deviation: ParameterDeviation) => Promise<Batch | null>;

  updateBatchNotes: (batchId: string, notes: string) => Promise<Batch | null>;
  addPhoto: (batchId: string, photo: { url: string; stage: BrewStage; caption: string }) => Promise<Batch | null>;
  updatePhoto: (batchId: string, photoId: string, updates: Partial<BrewPhoto>) => Promise<Batch | null>;
  deletePhoto: (batchId: string, photoId: string) => Promise<Batch | null>;

  generateBrewSteps: (batchId: string) => Promise<Batch | null>;
  updateBrewStep: (batchId: string, stepId: string, updates: Partial<BrewStep>) => Promise<Batch | null>;
  startBrewStep: (batchId: string, stepId: string) => Promise<Batch | null>;
  completeBrewStep: (batchId: string, stepId: string) => Promise<Batch | null>;
  skipBrewStep: (batchId: string, stepId: string) => Promise<Batch | null>;
  resetBrewSteps: (batchId: string) => Promise<Batch | null>;

  fetchTastings: (params?: { recipeId?: string; batchId?: string }) => Promise<void>;
  fetchTastingById: (id: string) => Promise<void>;
  createTasting: (tasting: Omit<Tasting, 'id'>) => Promise<Tasting | null>;
  updateTasting: (id: string, updates: Partial<Tasting>) => Promise<Tasting | null>;
  deleteTasting: (id: string) => Promise<boolean>;
  compareTastings: (ids: string[]) => Promise<void>;

  fetchPublicRecipes: (params?: { sort?: string; style?: string; search?: string }) => Promise<void>;
  fetchTrendingRecipes: () => Promise<void>;
  fetchUserStats: (userId: string) => Promise<void>;

  fetchComments: (recipeId: string) => Promise<void>;
  createComment: (comment: Omit<RecipeComment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RecipeComment | null>;
  deleteComment: (commentId: string) => Promise<boolean>;
  checkUserHasBrewed: (recipeId: string, userId: string) => Promise<boolean>;

  fetchInventory: (params?: { type?: IngredientType; lowStock?: boolean }) => Promise<void>;
  fetchInventoryCheck: (recipeId: string) => Promise<InventoryCheckResult | null>;
  createInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => Promise<InventoryItem | null>;
  updateInventoryItem: (id: string, updates: Partial<Omit<InventoryItem, 'id'>>) => Promise<InventoryItem | null>;
  deleteInventoryItem: (id: string) => Promise<boolean>;
  restockInventory: (id: string, amount: number) => Promise<InventoryItem | null>;
  clearInventoryErrors: () => void;

  fetchEquipment: (params?: { type?: EquipmentType; user?: string }) => Promise<void>;
  fetchEquipmentById: (id: string) => Promise<void>;
  createEquipment: (item: Omit<Equipment, 'id' | 'createdAt'>) => Promise<Equipment | null>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<Equipment | null>;
  deleteEquipment: (id: string) => Promise<boolean>;

  analyzeWater: (params: {
    calcium: number;
    magnesium: number;
    sodium: number;
    sulfate: number;
    chloride: number;
    bicarbonate: number;
    ph?: number;
    style: string;
    batchSize: number;
  }) => Promise<WaterAnalysisResult | null>;
  fetchWaterStyleTargets: () => Promise<void>;
  fetchMineralCompounds: () => Promise<void>;
  fetchWaterProfiles: () => Promise<void>;
  fetchWaterProfileById: (id: string) => Promise<WaterProfile | null>;
  saveWaterProfile: (profile: Omit<WaterProfile, 'id' | 'createdAt' | 'createdBy'>) => Promise<WaterProfile | null>;
  updateWaterProfile: (id: string, updates: Partial<WaterProfile>) => Promise<WaterProfile | null>;
  deleteWaterProfile: (id: string) => Promise<boolean>;
  clearWaterAnalysis: () => void;

  clearCurrent: () => void;
  setError: (error: string | null) => void;
}

const API_BASE = '/api';

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  return response.json();
}

export const useBrewStore = create<BrewState>((set, _get) => ({
  recipes: [],
  batches: [],
  calendarBatches: [],
  tastings: [],
  inventory: [],
  equipment: [],
  inventoryCheck: null,
  currentRecipe: null,
  currentBatch: null,
  currentTasting: null,
  recipeVersions: [],
  recipeLineage: [],
  comparison: [],
  tastingComparison: [],
  userBrewStats: null,
  comments: [],
  loading: false,
  error: null,
  inventoryShortages: [],
  inventoryWarnings: [],
  waterProfiles: [],
  waterAnalysisResult: null,
  waterStyleTargets: [],
  mineralCompounds: [],

  fetchRecipes: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams();
      if (params?.public) query.append('public', 'true');
      if (params?.user) query.append('user', params.user);
      const queryString = query.toString();
      const response = await apiFetch<Recipe[]>(`/recipes${queryString ? `?${queryString}` : ''}`);
      if (response.success) {
        set({ recipes: response.data, loading: false });
      } else {
        set({ error: response.error || '获取配方列表失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchRecipeById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Recipe>(`/recipes/${id}`);
      if (response.success) {
        set({ currentRecipe: response.data, loading: false });
      } else {
        set({ error: response.error || '获取配方失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchRecipeVersions: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Recipe[]>(`/recipes/${id}/versions`);
      if (response.success) {
        set({ recipeVersions: response.data, loading: false });
      } else {
        set({ error: response.error || '获取版本列表失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchRecipeLineage: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Recipe[]>(`/recipes/${id}/lineage`);
      if (response.success) {
        set({ recipeLineage: response.data, loading: false });
      } else {
        set({ error: response.error || '获取配方谱系失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  createRecipe: async (recipe) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Recipe>('/recipes', {
        method: 'POST',
        body: JSON.stringify(recipe),
      });
      if (response.success) {
        set((state) => ({
          recipes: [...state.recipes, response.data],
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '创建配方失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  updateRecipe: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Recipe>(`/recipes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response.success) {
        set((state) => ({
          recipes: state.recipes.map((r) => (r.id === id ? response.data : r)),
          currentRecipe: state.currentRecipe?.id === id ? response.data : state.currentRecipe,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新配方失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  deleteRecipe: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<{ message: string }>(`/recipes/${id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        set((state) => ({
          recipes: state.recipes.filter((r) => r.id !== id),
          currentRecipe: state.currentRecipe?.id === id ? null : state.currentRecipe,
          loading: false,
        }));
        return true;
      } else {
        set({ error: response.error || '删除配方失败', loading: false });
        return false;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return false;
    }
  },

  createNewVersion: async (parentId, branchName, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Recipe>(`/recipes/${parentId}/version`, {
        method: 'POST',
        body: JSON.stringify({ branchName, updates }),
      });
      if (response.success) {
        set((state) => ({
          recipes: [...state.recipes, response.data],
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '创建新版本失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  forkRecipe: async (id, createdBy) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Recipe>(`/recipes/${id}/fork`, {
        method: 'POST',
        body: JSON.stringify({ createdBy }),
      });
      if (response.success) {
        set((state) => ({
          recipes: [...state.recipes, response.data],
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || 'Fork 配方失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  compareRecipes: async (idA, idB) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<RecipeComparison[]>(`/recipes/compare/${idA}/${idB}`);
      if (response.success) {
        set({ comparison: response.data, loading: false });
      } else {
        set({ error: response.error || '对比配方失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchBatches: async (recipeId) => {
    set({ loading: true, error: null });
    try {
      const query = recipeId ? `?recipeId=${recipeId}` : '';
      const response = await apiFetch<Batch[]>(`/batches${query}`);
      if (response.success) {
        set({ batches: response.data, loading: false });
      } else {
        set({ error: response.error || '获取批次列表失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchBatchesByDateRange: async (startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch[]>(`/batches?startDate=${startDate}&endDate=${endDate}`);
      if (response.success) {
        set({ calendarBatches: response.data, loading: false });
      } else {
        set({ error: response.error || '获取批次列表失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchBatchById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${id}`);
      if (response.success) {
        set({ currentBatch: response.data, loading: false });
      } else {
        set({ error: response.error || '获取批次失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  createBatchFromRecipe: async (recipeId, batchData) => {
    set({ loading: true, error: null, inventoryShortages: [], inventoryWarnings: [] });
    try {
      const response = await fetch(`${API_BASE}/batches/from-recipe/${recipeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData),
      });
      const result = await response.json();
      if (result.success) {
        const warnings = result.warnings || [];
        set((state) => ({
          batches: [...state.batches, result.data],
          inventoryWarnings: warnings,
          loading: false,
        }));
        return { batch: result.data as Batch, warnings };
      } else {
        if (result.shortages) {
          set({ inventoryShortages: result.shortages, inventoryWarnings: result.warnings || [], error: result.error || '创建批次失败', loading: false });
        } else {
          set({ error: result.error || '创建批次失败', loading: false });
        }
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  updateBatch: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === id ? response.data : b)),
          currentBatch: state.currentBatch?.id === id ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新批次失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  deleteBatch: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<{ message: string }>(`/batches/${id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.filter((b) => b.id !== id),
          currentBatch: state.currentBatch?.id === id ? null : state.currentBatch,
          loading: false,
        }));
        return true;
      } else {
        set({ error: response.error || '删除批次失败', loading: false });
        return false;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return false;
    }
  },

  addReading: async (batchId, reading) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/readings`, {
        method: 'POST',
        body: JSON.stringify(reading),
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '添加读数失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  updateReading: async (batchId, readingId, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/readings/${readingId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新读数失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  deleteReading: async (batchId, readingId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/readings/${readingId}`, {
        method: 'DELETE',
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '删除读数失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  addDeviation: async (batchId, deviation) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/deviations`, {
        method: 'POST',
        body: JSON.stringify(deviation),
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '添加偏差记录失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  updateBatchNotes: async (batchId, notes) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/notes`, {
        method: 'PUT',
        body: JSON.stringify({ notes }),
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '保存笔记失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  addPhoto: async (batchId, photo) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/photos`, {
        method: 'POST',
        body: JSON.stringify(photo),
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '添加照片失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  updatePhoto: async (batchId, photoId, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/photos/${photoId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新照片失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  deletePhoto: async (batchId, photoId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/photos/${photoId}`, {
        method: 'DELETE',
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '删除照片失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  generateBrewSteps: async (batchId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/brew-steps/generate`, {
        method: 'POST',
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '生成酿造步骤失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  updateBrewStep: async (batchId, stepId, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/brew-steps/${stepId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新步骤失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  startBrewStep: async (batchId, stepId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/brew-steps/${stepId}/start`, {
        method: 'POST',
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '开始步骤失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  completeBrewStep: async (batchId, stepId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/brew-steps/${stepId}/complete`, {
        method: 'POST',
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '完成步骤失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  skipBrewStep: async (batchId, stepId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/brew-steps/${stepId}/skip`, {
        method: 'POST',
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '跳过步骤失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  resetBrewSteps: async (batchId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Batch>(`/batches/${batchId}/brew-steps/reset`, {
        method: 'POST',
      });
      if (response.success) {
        set((state) => ({
          batches: state.batches.map((b) => (b.id === batchId ? response.data : b)),
          currentBatch: state.currentBatch?.id === batchId ? response.data : state.currentBatch,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '重置步骤失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  fetchTastings: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams();
      if (params?.recipeId) query.append('recipeId', params.recipeId);
      if (params?.batchId) query.append('batchId', params.batchId);
      const queryString = query.toString();
      const response = await apiFetch<Tasting[]>(`/tastings${queryString ? `?${queryString}` : ''}`);
      if (response.success) {
        set({ tastings: response.data, loading: false });
      } else {
        set({ error: response.error || '获取品鉴记录失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchTastingById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Tasting>(`/tastings/${id}`);
      if (response.success) {
        set({ currentTasting: response.data, loading: false });
      } else {
        set({ error: response.error || '获取品鉴记录失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  createTasting: async (tasting) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Tasting>('/tastings', {
        method: 'POST',
        body: JSON.stringify(tasting),
      });
      if (response.success) {
        set((state) => ({
          tastings: [...state.tastings, response.data],
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '创建品鉴记录失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  updateTasting: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Tasting>(`/tastings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response.success) {
        set((state) => ({
          tastings: state.tastings.map((t) => (t.id === id ? response.data : t)),
          currentTasting: state.currentTasting?.id === id ? response.data : state.currentTasting,
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新品鉴记录失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  deleteTasting: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<{ message: string }>(`/tastings/${id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        set((state) => ({
          tastings: state.tastings.filter((t) => t.id !== id),
          currentTasting: state.currentTasting?.id === id ? null : state.currentTasting,
          loading: false,
        }));
        return true;
      } else {
        set({ error: response.error || '删除品鉴记录失败', loading: false });
        return false;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return false;
    }
  },

  compareTastings: async (ids) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<TastingComparison[]>('/tastings/compare', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
      if (response.success) {
        set({ tastingComparison: response.data, loading: false });
      } else {
        set({ error: response.error || '对比品鉴记录失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchPublicRecipes: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams();
      if (params?.sort) query.append('sort', params.sort);
      if (params?.style) query.append('style', params.style);
      if (params?.search) query.append('search', params.search);
      const queryString = query.toString();
      const response = await apiFetch<Recipe[]>(`/community/recipes${queryString ? `?${queryString}` : ''}`);
      if (response.success) {
        set({ recipes: response.data, loading: false });
      } else {
        set({ error: response.error || '获取社区配方失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchTrendingRecipes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Recipe[]>('/community/recipes/trending');
      if (response.success) {
        set({ loading: false });
        return;
      }
      set({ error: response.error || '获取热门配方失败', loading: false });
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchUserStats: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<UserBrewStats>(`/stats/${userId}`);
      if (response.success) {
        set({ userBrewStats: response.data, loading: false });
      } else {
        set({ error: response.error || '获取统计数据失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchComments: async (recipeId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<RecipeComment[]>(`/community/recipes/${recipeId}/comments`);
      if (response.success) {
        set({ comments: response.data, loading: false });
      } else {
        set({ error: response.error || '获取评论失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  createComment: async (comment) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<RecipeComment>(`/community/recipes/${comment.recipeId}/comments`, {
        method: 'POST',
        body: JSON.stringify(comment),
      });
      if (response.success) {
        set((state) => ({
          comments: [...state.comments, response.data],
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '发表评论失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  deleteComment: async (commentId) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<{ message: string }>(`/community/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (response.success) {
        set((state) => ({
          comments: state.comments.filter((c) => c.id !== commentId),
          loading: false,
        }));
        return true;
      } else {
        set({ error: response.error || '删除评论失败', loading: false });
        return false;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return false;
    }
  },

  checkUserHasBrewed: async (recipeId, userId) => {
    try {
      const response = await apiFetch<{ hasBrewed: boolean }>(
        `/community/recipes/${recipeId}/check-brewed?userId=${userId}`
      );
      if (response.success) {
        return response.data.hasBrewed;
      }
      return false;
    } catch (_error) {
      return false;
    }
  },

  fetchInventory: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams();
      if (params?.type) query.append('type', params.type);
      if (params?.lowStock) query.append('lowStock', 'true');
      const queryString = query.toString();
      const response = await apiFetch<InventoryItem[]>(`/inventory${queryString ? `?${queryString}` : ''}`);
      if (response.success) {
        set({ inventory: response.data, loading: false });
      } else {
        set({ error: response.error || '获取库存列表失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchInventoryCheck: async (recipeId) => {
    set({ loading: true, error: null, inventoryShortages: [], inventoryWarnings: [], inventoryCheck: null });
    try {
      const response = await apiFetch<InventoryCheckResult>(`/inventory/check/${recipeId}`);
      if (response.success) {
        set({ inventoryCheck: response.data, inventoryShortages: response.data.shortages, inventoryWarnings: response.data.warnings, loading: false });
        return response.data;
      } else {
        set({ error: response.error || '库存检查失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  createInventoryItem: async (item) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<InventoryItem>('/inventory', {
        method: 'POST',
        body: JSON.stringify(item),
      });
      if (response.success) {
        set((state) => ({
          inventory: [...state.inventory, response.data],
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '创建库存项失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  updateInventoryItem: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<InventoryItem>(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response.success) {
        set((state) => ({
          inventory: state.inventory.map((i) => (i.id === id ? response.data : i)),
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新库存项失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  deleteInventoryItem: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<{ message: string }>(`/inventory/${id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        set((state) => ({
          inventory: state.inventory.filter((i) => i.id !== id),
          loading: false,
        }));
        return true;
      } else {
        set({ error: response.error || '删除库存项失败', loading: false });
        return false;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return false;
    }
  },

  restockInventory: async (id, amount) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<InventoryItem>(`/inventory/${id}/restock`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      if (response.success) {
        set((state) => ({
          inventory: state.inventory.map((i) => (i.id === id ? response.data : i)),
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '补货失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  clearInventoryErrors: () => {
    set({ inventoryShortages: [], inventoryWarnings: [], inventoryCheck: null, error: null });
  },

  fetchEquipment: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams();
      if (params?.type) query.append('type', params.type);
      if (params?.user) query.append('user', params.user);
      const queryString = query.toString();
      const response = await apiFetch<Equipment[]>(`/equipment${queryString ? `?${queryString}` : ''}`);
      if (response.success) {
        set({ equipment: response.data, loading: false });
      } else {
        set({ error: response.error || '获取设备列表失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchEquipmentById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Equipment>(`/equipment/${id}`);
      if (response.success) {
        set((state) => ({
          equipment: state.equipment.map(e => e.id === id ? response.data : e),
          loading: false,
        }));
      } else {
        set({ error: response.error || '获取设备失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  createEquipment: async (item) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Equipment>('/equipment', {
        method: 'POST',
        body: JSON.stringify(item),
      });
      if (response.success) {
        set((state) => ({
          equipment: [...state.equipment, response.data],
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '创建设备失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  updateEquipment: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<Equipment>(`/equipment/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response.success) {
        set((state) => ({
          equipment: state.equipment.map((e) => (e.id === id ? response.data : e)),
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新设备失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  deleteEquipment: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<{ message: string }>(`/equipment/${id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        set((state) => ({
          equipment: state.equipment.filter((e) => e.id !== id),
          loading: false,
        }));
        return true;
      } else {
        set({ error: response.error || '删除设备失败', loading: false });
        return false;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return false;
    }
  },

  analyzeWater: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<WaterAnalysisResult>('/water/analyze', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      if (response.success) {
        set({ waterAnalysisResult: response.data, loading: false });
        return response.data;
      } else {
        set({ error: response.error || '水质分析失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  fetchWaterStyleTargets: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<BeerStyleWaterTarget[]>('/water/styles');
      if (response.success) {
        set({ waterStyleTargets: response.data, loading: false });
      } else {
        set({ error: response.error || '获取水化学区间失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchMineralCompounds: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<MineralCompound[]>('/water/minerals');
      if (response.success) {
        set({ mineralCompounds: response.data, loading: false });
      } else {
        set({ error: response.error || '获取矿物质数据失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  fetchWaterProfiles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<WaterProfile[]>('/water/profiles');
      if (response.success) {
        set({ waterProfiles: response.data, loading: false });
      } else {
        set({ error: response.error || '获取水源配置失败', loading: false });
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
    }
  },

  saveWaterProfile: async (profile) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<WaterProfile>('/water/profiles', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
      if (response.success) {
        set((state) => ({
          waterProfiles: [...state.waterProfiles, response.data],
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '保存水源配置失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  fetchWaterProfileById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<WaterProfile>(`/water/profiles/${id}`);
      if (response.success) {
        set({ loading: false });
        return response.data;
      } else {
        set({ error: response.error || '获取水源配置失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  updateWaterProfile: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<WaterProfile>(`/water/profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response.success) {
        set((state) => ({
          waterProfiles: state.waterProfiles.map((p) =>
            p.id === id ? response.data : p
          ),
          loading: false,
        }));
        return response.data;
      } else {
        set({ error: response.error || '更新水源配置失败', loading: false });
        return null;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return null;
    }
  },

  deleteWaterProfile: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch<{ message: string }>(`/water/profiles/${id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        set((state) => ({
          waterProfiles: state.waterProfiles.filter((p) => p.id !== id),
          loading: false,
        }));
        return true;
      } else {
        set({ error: response.error || '删除水源配置失败', loading: false });
        return false;
      }
    } catch (_error) {
      set({ error: '网络错误', loading: false });
      return false;
    }
  },

  clearWaterAnalysis: () => {
    set({ waterAnalysisResult: null });
  },

  clearCurrent: () => {
    set({
      currentRecipe: null,
      currentBatch: null,
      currentTasting: null,
      recipeVersions: [],
      recipeLineage: [],
      comparison: [],
      tastingComparison: [],
      comments: [],
      error: null,
    });
  },

  setError: (error) => {
    set({ error });
  },
}));
