import { Family } from '../types/family';
import { request as invoke } from '../utils/request';

export async function listFamilies(): Promise<Family[]> {
    const response = await invoke<any>('list_families');
    if (response && typeof response === 'object' && Array.isArray(response.families)) {
        return response.families;
    }
    return response || [];
}

export async function createFamily(
    name: string,
    color?: string,
    description?: string,
): Promise<Family> {
    return await invoke('create_family', { name, color, description });
}

export async function updateFamily(
    id: string,
    name?: string,
    color?: string,
    description?: string,
): Promise<Family> {
    return await invoke('update_family', { id, name, color, description });
}

export async function deleteFamily(id: string): Promise<void> {
    return await invoke('delete_family', { id });
}

export async function assignAccountFamily(
    accountId: string,
    familyId: string | null,
): Promise<void> {
    return await invoke('assign_account_family', { accountId, familyId });
}

export async function unassignAccountFamily(
    accountId: string,
    familyId: string,
): Promise<void> {
    return await invoke('unassign_account_family', { accountId, familyId });
}

export async function batchAssignAccountFamily(
    accountIds: string[],
    familyId: string | null,
): Promise<number> {
    return await invoke('batch_assign_account_family', { accountIds, familyId });
}
