import { create } from 'zustand';
import { Family } from '../types/family';
import * as familyService from '../services/familyService';

interface FamilyState {
    families: Family[];
    loading: boolean;
    error: string | null;
    selectedFamilyId: string | null;

    fetchFamilies: () => Promise<void>;
    createFamily: (name: string, color?: string, description?: string) => Promise<Family>;
    updateFamily: (id: string, name?: string, color?: string, description?: string) => Promise<Family>;
    deleteFamily: (id: string) => Promise<void>;
    assignAccountFamily: (accountId: string, familyId: string | null) => Promise<void>;
    batchAssignAccountFamily: (accountIds: string[], familyId: string | null) => Promise<number>;
    setSelectedFamilyId: (id: string | null) => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
    families: [],
    loading: false,
    error: null,
    selectedFamilyId: null,

    fetchFamilies: async () => {
        set({ loading: true, error: null });
        try {
            const families = await familyService.listFamilies();
            set({ families, loading: false });
        } catch (error) {
            console.error('[FamilyStore] Fetch families failed:', error);
            set({ error: String(error), loading: false });
        }
    },

    createFamily: async (name: string, color?: string, description?: string) => {
        set({ loading: true, error: null });
        try {
            const family = await familyService.createFamily(name, color, description);
            await get().fetchFamilies();
            set({ loading: false });
            return family;
        } catch (error) {
            set({ error: String(error), loading: false });
            throw error;
        }
    },

    updateFamily: async (id: string, name?: string, color?: string, description?: string) => {
        set({ loading: true, error: null });
        try {
            const family = await familyService.updateFamily(id, name, color, description);
            await get().fetchFamilies();
            set({ loading: false });
            return family;
        } catch (error) {
            set({ error: String(error), loading: false });
            throw error;
        }
    },

    deleteFamily: async (id: string) => {
        set({ loading: true, error: null });
        try {
            await familyService.deleteFamily(id);
            const current = get().selectedFamilyId;
            if (current === id) {
                set({ selectedFamilyId: null });
            }
            await get().fetchFamilies();
            set({ loading: false });
        } catch (error) {
            set({ error: String(error), loading: false });
            throw error;
        }
    },

    assignAccountFamily: async (accountId: string, familyId: string | null) => {
        try {
            await familyService.assignAccountFamily(accountId, familyId);
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    batchAssignAccountFamily: async (accountIds: string[], familyId: string | null) => {
        try {
            return await familyService.batchAssignAccountFamily(accountIds, familyId);
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    setSelectedFamilyId: (id: string | null) => {
        set({ selectedFamilyId: id });
    },
}));
