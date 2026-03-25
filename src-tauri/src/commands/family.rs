use crate::models::family::Family;
use crate::modules;

/// List all family groups
#[tauri::command]
pub async fn list_families() -> Result<Vec<Family>, String> {
    modules::family::list_families()
}

/// Create a new family group
#[tauri::command]
pub async fn create_family(
    name: String,
    color: Option<String>,
    description: Option<String>,
) -> Result<Family, String> {
    modules::family::create_family(name, color, description)
}

/// Update an existing family group
#[tauri::command]
pub async fn update_family(
    id: String,
    name: Option<String>,
    color: Option<String>,
    description: Option<String>,
) -> Result<Family, String> {
    modules::family::update_family(id, name, color, description)
}

/// Delete a family group
#[tauri::command]
pub async fn delete_family(id: String) -> Result<(), String> {
    modules::family::delete_family(id)
}

/// Assign an account to a family group (pass null/None to unassign)
#[tauri::command]
pub async fn assign_account_family(
    account_id: String,
    family_id: Option<String>,
) -> Result<(), String> {
    modules::family::assign_account_to_family(&account_id, family_id)
}

/// Batch assign multiple accounts to a family group
#[tauri::command]
pub async fn batch_assign_account_family(
    account_ids: Vec<String>,
    family_id: Option<String>,
) -> Result<u32, String> {
    modules::family::batch_assign_accounts(&account_ids, family_id)
}
