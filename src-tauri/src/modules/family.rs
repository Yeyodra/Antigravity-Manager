use serde_json;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

use crate::models::family::{Family, FamilyIndex};

const FAMILIES_FILE: &str = "families.json";

/// Get families file path
fn get_families_path() -> Result<PathBuf, String> {
    let data_dir = crate::modules::account::get_data_dir()?;
    Ok(data_dir.join(FAMILIES_FILE))
}

/// Load all families
pub fn load_families() -> Result<FamilyIndex, String> {
    let path = get_families_path()?;

    if !path.exists() {
        return Ok(FamilyIndex::new());
    }

    let content =
        fs::read_to_string(&path).map_err(|e| format!("failed_to_read_families: {}", e))?;

    if content.trim().is_empty() {
        return Ok(FamilyIndex::new());
    }

    serde_json::from_str::<FamilyIndex>(&content)
        .map_err(|e| format!("failed_to_parse_families: {}", e))
}

/// Platform-specific atomic file replacement (local copy — account.rs version is private)
#[cfg(target_os = "windows")]
fn atomic_replace_file(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    use std::os::windows::ffi::OsStrExt;

    type Bool = i32;
    type Dword = u32;

    #[link(name = "Kernel32")]
    extern "system" {
        fn MoveFileExW(
            lp_existing_file_name: *const u16,
            lp_new_file_name: *const u16,
            dw_flags: Dword,
        ) -> Bool;
    }

    let src_wide: Vec<u16> = src
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let dst_wide: Vec<u16> = dst
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    const MOVEFILE_REPLACE_EXISTING: u32 = 0x1;
    const MOVEFILE_WRITE_THROUGH: u32 = 0x8;
    let flags = MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH;

    let result = unsafe { MoveFileExW(src_wide.as_ptr(), dst_wide.as_ptr(), flags) };
    if result == 0 {
        let err = std::io::Error::last_os_error();
        let _ = fs::remove_file(src);
        return Err(format!("MoveFileExW failed: {}", err));
    }

    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn atomic_replace_file(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    fs::rename(src, dst).map_err(|e| format!("rename failed: {}", e))
}

/// Save families index (atomic write: temp + rename)
fn save_families(index: &FamilyIndex) -> Result<(), String> {
    let data_dir = crate::modules::account::get_data_dir()?;
    let path = data_dir.join(FAMILIES_FILE);
    let temp_filename = format!("{}.tmp.{}", FAMILIES_FILE, Uuid::new_v4());
    let temp_path = data_dir.join(&temp_filename);

    let content = serde_json::to_string_pretty(index)
        .map_err(|e| format!("failed_to_serialize_families: {}", e))?;

    if let Err(e) = fs::write(&temp_path, content) {
        let _ = fs::remove_file(&temp_path);
        return Err(format!("failed_to_write_temp_families: {}", e));
    }

    if let Err(e) = atomic_replace_file(&temp_path, &path) {
        let _ = fs::remove_file(&temp_path);
        return Err(format!("failed_to_replace_families_file: {}", e));
    }

    Ok(())
}

/// Create a new family group
pub fn create_family(
    name: String,
    color: Option<String>,
    description: Option<String>,
) -> Result<Family, String> {
    let mut index = load_families()?;

    // Check for duplicate name
    if index
        .families
        .iter()
        .any(|f| f.name.eq_ignore_ascii_case(&name))
    {
        return Err(format!("family_name_already_exists: {}", name));
    }

    let mut family = Family::new(Uuid::new_v4().to_string(), name, color);
    family.description = description;

    index.families.push(family.clone());
    save_families(&index)?;

    crate::modules::logger::log_info(&format!(
        "Created family group: {} ({})",
        family.name, family.id
    ));
    Ok(family)
}

/// Update an existing family group
pub fn update_family(
    id: String,
    name: Option<String>,
    color: Option<String>,
    description: Option<String>,
) -> Result<Family, String> {
    let mut index = load_families()?;

    let family = index
        .families
        .iter_mut()
        .find(|f| f.id == id)
        .ok_or_else(|| format!("family_not_found: {}", id))?;

    if let Some(new_name) = name {
        // Check for duplicate name (excluding self)
        if index
            .families
            .iter()
            .any(|f| f.id != id && f.name.eq_ignore_ascii_case(&new_name))
        {
            return Err(format!("family_name_already_exists: {}", new_name));
        }
        family.name = new_name;
    }
    if let Some(new_color) = color {
        family.color = new_color;
    }
    if let Some(new_desc) = description {
        family.description = if new_desc.is_empty() {
            None
        } else {
            Some(new_desc)
        };
    }

    let updated = family.clone();
    save_families(&index)?;

    crate::modules::logger::log_info(&format!(
        "Updated family group: {} ({})",
        updated.name, updated.id
    ));
    Ok(updated)
}

/// Delete a family group and unassign all accounts from it
pub fn delete_family(id: String) -> Result<(), String> {
    let mut index = load_families()?;

    let before_len = index.families.len();
    index.families.retain(|f| f.id != id);

    if index.families.len() == before_len {
        return Err(format!("family_not_found: {}", id));
    }

    save_families(&index)?;

    // Unassign all accounts from this family
    unassign_accounts_from_family(&id)?;

    crate::modules::logger::log_info(&format!("Deleted family group: {}", id));
    Ok(())
}

/// List all families
pub fn list_families() -> Result<Vec<Family>, String> {
    let index = load_families()?;
    Ok(index.families)
}

/// Assign an account to a family (or unassign by passing None)
pub fn assign_account_to_family(account_id: &str, family_id: Option<String>) -> Result<(), String> {
    // Validate family exists if assigning
    if let Some(ref fid) = family_id {
        let index = load_families()?;
        if !index.families.iter().any(|f| f.id == *fid) {
            return Err(format!("family_not_found: {}", fid));
        }
    }

    let mut account = crate::modules::account::load_account(account_id)?;
    account.family_id = family_id.clone();
    crate::modules::account::save_account(&account)?;

    let action = family_id.as_deref().unwrap_or("ungrouped");
    crate::modules::logger::log_info(&format!(
        "Account {} assigned to family: {}",
        account_id, action
    ));
    Ok(())
}

/// Batch assign multiple accounts to a family
pub fn batch_assign_accounts(
    account_ids: &[String],
    family_id: Option<String>,
) -> Result<u32, String> {
    // Validate family exists if assigning
    if let Some(ref fid) = family_id {
        let index = load_families()?;
        if !index.families.iter().any(|f| f.id == *fid) {
            return Err(format!("family_not_found: {}", fid));
        }
    }

    let mut success_count = 0u32;
    for aid in account_ids {
        match assign_account_to_family(aid, family_id.clone()) {
            Ok(_) => success_count += 1,
            Err(e) => {
                crate::modules::logger::log_warn(&format!(
                    "Failed to assign account {} to family: {}",
                    aid, e
                ));
            }
        }
    }

    Ok(success_count)
}

/// Unassign all accounts from a specific family (used when deleting a family)
fn unassign_accounts_from_family(family_id: &str) -> Result<(), String> {
    let accounts = crate::modules::account::list_accounts()?;
    for account in accounts {
        if account.family_id.as_deref() == Some(family_id) {
            let mut acc = account;
            acc.family_id = None;
            if let Err(e) = crate::modules::account::save_account(&acc) {
                crate::modules::logger::log_warn(&format!(
                    "Failed to unassign account {} from deleted family: {}",
                    acc.id, e
                ));
            }
        }
    }
    Ok(())
}
