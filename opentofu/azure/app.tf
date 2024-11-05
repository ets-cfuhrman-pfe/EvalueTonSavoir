resource "azurerm_container_group" "app" {
  name                = var.container_group_app_name
  location            = azurerm_resource_group.resource_group.location
  resource_group_name = azurerm_resource_group.resource_group.name
  os_type             = var.container_group_os
  dns_name_label      = var.container_group_app_dns

  image_registry_credential {
    server   = var.image_registry_server
    username = var.image_registry_user
    password = var.image_registry_password
  }

  container {
    name   = var.frontend_image_name
    image  = var.frontend_image
    cpu    = var.frontend_image_cpu
    memory = var.frontend_image_memory

    environment_variables = {
      VITE_BACKEND_URL        = "http://${var.container_group_router_dns}.${lower(replace(azurerm_resource_group.resource_group.location, " ", ""))}.azurecontainer.io"
    }

    ports {
      port  = var.frontend_port
    }
  }

  container {
    name   = var.backend_image_name
    image  = var.backend_image
    cpu    = var.backend_image_cpu
    memory = var.backend_image_memory

    environment_variables = {
      PORT                = var.backend_port
      MONGO_URI           = azurerm_cosmosdb_account.cosmosdb_account.connection_strings[0]
      MONGO_DATABASE      = azurerm_cosmosdb_mongo_collection.cosmosdb_mongo_collection.database_name
      EMAIL_SERVICE       = var.backend_email_service
      SENDER_EMAIL        = var.backend_email_sender
      EMAIL_PSW           = var.backend_email_password
      JWT_SECRET          = var.backend_jwt_secret
      SESSION_Secret      = var.backend_session_secret
      SITE_URL            = "http://${var.container_group_router_dns}.${lower(replace(azurerm_resource_group.resource_group.location, " ", ""))}.azurecontainer.io"
      FRONTEND_PORT       = var.frontend_port
      USE_PORTS           = var.backend_use_port
      AUTHENTICATED_ROOMS = var.backend_use_auth_student
    }

    ports {
      port  = var.backend_port
    }

    volume {
      name                  = azurerm_storage_share.backend_storage_share.name
      mount_path            = var.backend_volume_mount_path
      share_name            = azurerm_storage_share.backend_storage_share.name
      storage_account_name  = azurerm_storage_account.storage_account.name
      storage_account_key   = azurerm_storage_account.storage_account.primary_access_key
    }
  }

  depends_on = [azurerm_cosmosdb_mongo_collection.cosmosdb_mongo_collection]
}
