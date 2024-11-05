resource "azurerm_storage_account" "storage_account" {
  name                     = var.config_volume_storage_account_name
  resource_group_name      = azurerm_resource_group.resource_group.name
  location                 = azurerm_resource_group.resource_group.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  depends_on = [azurerm_resource_group.resource_group]
}

resource "azurerm_storage_share" "backend_storage_share" {
  name                 = var.backend_volume_share_name
  storage_account_name = azurerm_storage_account.storage_account.name
  quota                = 1

  depends_on = [azurerm_storage_account.storage_account]
}

resource "azurerm_storage_share" "router_storage_share" {
  name                 = var.router_volume_share_name
  storage_account_name = azurerm_storage_account.storage_account.name
  quota                = 1

  depends_on = [azurerm_storage_account.storage_account]
}

resource "null_resource" "upload_file" {
  provisioner "local-exec" {
    command = <<EOT
      az storage file upload \
        --account-name ${azurerm_storage_account.storage_account.name} \
        --share-name ${azurerm_storage_share.backend_storage_share.name} \
        --source ../auth_config.json \
        --path auth_config.json
    EOT
  }

  provisioner "local-exec" {
    command = <<EOT
      az storage file upload \
        --account-name ${azurerm_storage_account.storage_account.name} \
        --share-name ${azurerm_storage_share.router_storage_share.name} \
        --source ../default.conf \
        --path default.conf
    EOT
  }

  depends_on = [
    azurerm_storage_share.backend_storage_share,
    azurerm_storage_share.router_storage_share
  ]
}