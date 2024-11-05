resource "azurerm_container_group" "router" {
  name                = var.container_group_router_name
  location            = azurerm_resource_group.resource_group.location
  resource_group_name = azurerm_resource_group.resource_group.name
  os_type             = var.container_group_os
  dns_name_label      = var.container_group_router_dns

  image_registry_credential {
    server   = var.image_registry_server
    username = var.image_registry_user
    password = var.image_registry_password
  }

  container {
    name   = var.router_image_name
    image  = var.router_image
    cpu    = var.router_image_cpu
    memory = var.router_image_memory

    ports {
      port  = var.router_port
    }

    volume {
      name                  = azurerm_storage_share.router_storage_share.name
      mount_path            = var.router_volume_mount_path
      share_name            = azurerm_storage_share.router_storage_share.name
      storage_account_name  = azurerm_storage_account.storage_account.name
      storage_account_key   = azurerm_storage_account.storage_account.primary_access_key
    }
  }

  depends_on = [azurerm_container_group.app]
}
