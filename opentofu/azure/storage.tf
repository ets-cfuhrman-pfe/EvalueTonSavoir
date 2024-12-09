resource "azurerm_storage_account" "storage_account" {
  name                     = var.config_volume_storage_account_name
  resource_group_name      = azurerm_resource_group.resource_group.name
  location                 = azurerm_resource_group.resource_group.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  depends_on = [azurerm_resource_group.resource_group]
}

resource "azurerm_storage_share" "backend_storage_share" {
  name                 = var.backend_storage_share_name
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

  depends_on = [azurerm_storage_share.backend_storage_share]
}

locals {
  # Get the current timestamp (UTC)
  current_timestamp = timestamp()
  start_time = local.current_timestamp
  expiry_time = timeadd(local.current_timestamp, "1h")
}

data "azurerm_storage_account_sas" "storage_access" {
  connection_string = azurerm_storage_account.storage_account.primary_connection_string
  signed_version    = "2022-11-02"

  services {
    file  = true
    blob  = false
    queue = false
    table = false
  }

  resource_types {
    object    = true
    container = false
    service   = false
  }

  permissions {
    read    = true
    write   = false
    delete  = false
    list    = true
    add     = false
    create  = false
    update  = false
    process = false
    tag     = false
    filter  = false
  }

  start                = local.start_time
  expiry               = local.expiry_time

  depends_on = [null_resource.upload_file]
}