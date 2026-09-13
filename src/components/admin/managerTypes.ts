export type FieldType = 'text' | 'long_text' | 'number' | 'percentage' | 'date' | 'select' | 'boolean' | 'email' | 'url' | 'image';

export interface ManagerField {
    id?: number;
    manager_id?: number;
    name: string;
    field_type: FieldType;
    required: boolean;
    options: string[];
    display_order?: number;
    is_active?: boolean;
}

export interface ManagerDefinition {
    id: number;
    name: string;
    slug: string;
    description: string;
    category?: string;
    project_name?: string;
    icon?: string;
    image?: string;
    status?: string;
    created_by: string;
    created_by_email: string;
    is_active?: boolean;
    fields?: ManagerField[];
}

export interface ManagerRecord {
    id: number;
    manager_id: number;
    created_by: string;
    created_by_email: string;
    created_at: string;
    updated_at: string;
    values: Record<string, string>;
}

export const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'long_text', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select / Dropdown' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
    { value: 'image', label: 'Image Upload' },
];

export const MAX_DYNAMIC_FIELDS = 20;
