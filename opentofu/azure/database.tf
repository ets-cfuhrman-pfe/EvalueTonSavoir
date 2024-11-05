resource "azurerm_cosmosdb_account" "cosmosdb_account" {
  name                = var.cosmosdb_account_name
  resource_group_name = azurerm_resource_group.resource_group.name
  location            = azurerm_resource_group.resource_group.location
  offer_type          = "Standard"
  kind                = "MongoDB"

  capabilities {
    name = "EnableMongo"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    failover_priority = 0
    location          = azurerm_resource_group.resource_group.location
  }

  depends_on = [azurerm_resource_group.resource_group]
}

resource "azurerm_cosmosdb_mongo_collection" "cosmosdb_mongo_collection" {
  name                = var.mongo_database_name
  resource_group_name = azurerm_resource_group.resource_group.name
  account_name        = azurerm_cosmosdb_account.cosmosdb_account.name
  database_name       = var.mongo_database_name

  index {
    keys = ["_id"]
    unique = true
  }

  depends_on = [azurerm_cosmosdb_account.cosmosdb_account]
}