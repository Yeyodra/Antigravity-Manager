use serde::{Deserialize, Serialize};

/// Family group for organizing accounts
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Family {
    pub id: String,
    pub name: String,
    /// Hex color for visual badge (e.g. "#3B82F6")
    #[serde(default = "default_color")]
    pub color: String,
    pub created_at: i64,
    /// Optional description
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

fn default_color() -> String {
    "#3B82F6".to_string()
}

impl Family {
    pub fn new(id: String, name: String, color: Option<String>) -> Self {
        Self {
            id,
            name,
            color: color.unwrap_or_else(default_color),
            created_at: chrono::Utc::now().timestamp(),
            description: None,
        }
    }
}

/// Container for families.json persistence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FamilyIndex {
    pub version: String,
    pub families: Vec<Family>,
}

impl FamilyIndex {
    pub fn new() -> Self {
        Self {
            version: "1.0".to_string(),
            families: Vec::new(),
        }
    }
}

impl Default for FamilyIndex {
    fn default() -> Self {
        Self::new()
    }
}
