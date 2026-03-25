export interface Family {
    id: string;
    name: string;
    color: string;
    created_at: number;
    description?: string;
}

export interface FamilyIndex {
    version: string;
    families: Family[];
}
