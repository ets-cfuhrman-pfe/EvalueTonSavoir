# Create Virtual Machine
resource "azurerm_linux_virtual_machine" "vm" {
  name                = var.vm_name
  resource_group_name = azurerm_resource_group.resource_group.name
  location            = azurerm_resource_group.resource_group.location
  size                = var.vm_size
  admin_username      = var.vm_user
  admin_password      = var.vm_password
  disable_password_authentication = false

  network_interface_ids = [azurerm_network_interface.nic.id]

  os_disk {
    name              = var.vm_os_disk_name
    caching           = "ReadWrite"
    storage_account_type = var.vm_os_disk_type
  }

  source_image_reference {
    publisher = var.vm_image_publisher
    offer     = var.vm_image_offer
    sku       = var.vm_image_plan
    version   = var.vm_image_version
  }

  custom_data = base64encode(<<-EOT
    #!/bin/bash
    sudo apt-get update -y
    sudo apt-get install -y docker.io
    sudo apt-get install -y docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker

    sudo usermod -aG docker ${var.vm_user}
    sudo newgrp docker

    su - ${var.vm_user} -c '

    curl -o auth_config.json \
      "https://${azurerm_storage_account.storage_account.name}.file.core.windows.net/${azurerm_storage_share.backend_storage_share.name}/auth_config.json${data.azurerm_storage_account_sas.storage_access.sas}"

    curl -L -o docker-compose.yaml ${var.docker_compose_url}

    export VITE_BACKEND_URL=http://${var.dns}.${lower(replace(azurerm_resource_group.resource_group.location, " ", ""))}.cloudapp.azure.com
    export PORT=${var.backend_port}
    export MONGO_URI="${azurerm_cosmosdb_account.cosmosdb_account.primary_mongodb_connection_string}"
    export MONGO_DATABASE=${azurerm_cosmosdb_mongo_collection.cosmosdb_mongo_collection.database_name}
    export EMAIL_SERVICE=${var.backend_email_service}
    export SENDER_EMAIL=${var.backend_email_sender}
    export EMAIL_PSW="${var.backend_email_password}"
    export JWT_SECRET=${var.backend_jwt_secret}
    export SESSION_Secret=${var.backend_session_secret}
    export SITE_URL=http://${var.dns}.${lower(replace(azurerm_resource_group.resource_group.location, " ", ""))}.cloudapp.azure.com
    export FRONTEND_PORT=${var.frontend_port}
    export USE_PORTS=${var.backend_use_port}
    export AUTHENTICATED_ROOMS=${var.backend_use_auth_student}
    export QUIZROOM_IMAGE=${var.quizroom_image}

    docker-compose up -d
    '
  EOT
  )

  depends_on = [
    azurerm_cosmosdb_mongo_collection.cosmosdb_mongo_collection,
    data.azurerm_storage_account_sas.storage_access]
}
