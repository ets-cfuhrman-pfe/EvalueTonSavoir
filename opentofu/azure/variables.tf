variable "subscription_id" {
  description = "The azure subscription id"
  type        = string
}

variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
  default     = "evaluetonsavoir"
}

variable "location" {
  description = "The location for resources"
  type        = string
  default     = "Canada Central"
}

variable "frontend_port" {
  description = "The frontend port"
  type        = number
  default     = 5173
}

variable "backend_port" {
  description = "The backend port"
  type        = number
  default     = 3000
}

variable "backend_use_port" {
  description = "If true use port in the backend, else no"
  type        = bool
  default     = false
}

variable "backend_use_auth_student" {
  description = "If true student need to authenticate, else no"
  type        = bool
  default     = false
}

variable "backend_session_secret" {
  description = "The backend session secret"
  type        = string
}

variable "backend_email_service" {
  description = "The name of the service use for sending email"
  type        = string
  default     = "gmail"
}

variable "backend_email_sender" {
  description = "The email address used to send email"
  type        = string
}

variable "backend_email_password" {
  description = "The email password"
  type        = string
}

variable "backend_jwt_secret" {
  description = "The secret used to sign the jwt"
  type        = string
}

variable "backend_storage_share_name" {
  description = "The backend volume share name"
  type        = string
  default     = "auth-config-share"
}

variable "config_volume_storage_account_name" {
  description = "The volume storage account name"
  type        = string
  default     = "evaluetonsavoirstorage"
}

variable "mongo_database_name" {
  description = "The name of the database"
  type        = string
  default     = "evaluetonsavoir"
}

variable "cosmosdb_account_name" {
  description = "The name of the cosmosdb account"
  type        = string
  default     = "evaluetonsavoircosmosdb"
}

variable "vnet_name" {
  description = "The name of the virtual network"
  type        = string
  default     = "evaluetonsavoirVnet"
}

variable "subnet_name" {
  description = "The name of the subnet"
  type        = string
  default     = "evaluetonsavoirSubnet"
}

variable "public_ip_name" {
  description = "The name of the public ip"
  type        = string
  default     = "evaluetonsavoirPublicIp"
}

variable "nsg_name" {
  description = "The name of the network security group"
  type        = string
  default     = "evaluetonsavoirnsg"
}

variable "nsg_ssh_ip_range" {
  description = "The ip range that can access to the port 22 using the network security group"
  type        = string
  default     = "0.0.0.0/0"
}

variable "nsg_http_ip_range" {
  description = "The ip range that can access to the port 80 using the network security group"
  type        = string
  default     = "0.0.0.0/0"
}

variable "nsg_https_ip_range" {
  description = "The ip range that can access to the port 443 using the network security group"
  type        = string
  default     = "0.0.0.0/0"
}

variable "network_interface_name" {
  description = "The name of the network interface"
  type        = string
  default     = "evaluetonsavoirNetworkInterface"
}

variable "dns" {
  description = "The dns of the public ip"
  type        = string
  default     = "evaluetonsavoir"
}

variable "vm_name" {
  description = "The name of the virtual machine"
  type        = string
  default     = "evaluetonsavoir"
}

variable "vm_size" {
  description = "The size of the virtual machine"
  type        = string
  default     = "Standard_B2s"
}

variable "vm_user" {
  description = "The username of the virtual machine"
  type        = string
}

variable "vm_password" {
  description = "The password of the virtual machine"
  type        = string
}

variable "vm_os_disk_name" {
  description = "The name of the os disk of the virtual machine"
  type        = string
  default     = "evaluetonsavoirOsDisk"
}

variable "vm_os_disk_type" {
  description = "The type of the os disk of the virtual machine"
  type        = string
  default     = "Standard_LRS"
}

variable "vm_image_publisher" {
  description = "The publisher of the image of the virtual machine"
  type        = string
  default     = "Canonical"
}

variable "vm_image_offer" {
  description = "The id of the image of the virtual machine"
  type        = string
  default     = "0001-com-ubuntu-server-jammy"
}

variable "vm_image_plan" {
  description = "The plan of the image of the virtual machine"
  type        = string
  default     = "22_04-lts"
}

variable "vm_image_version" {
  description = "The version of the image of the virtual machine"
  type        = string
  default     = "latest"
}

variable "docker_compose_url" {
  description = "The url from where the docker compose file is downloaded"
  type        = string
  default     = "https://raw.githubusercontent.com/ets-cfuhrman-pfe/EvalueTonSavoir/refs/heads/main/opentofu/docker-compose.yaml"
}

variable "quizroom_image" {
  description = "The image of the quiz room"
  type        = string
  default     = "ghrc.io/fuhrmanator/evaluetonsavoir-quizroom:latest"
}