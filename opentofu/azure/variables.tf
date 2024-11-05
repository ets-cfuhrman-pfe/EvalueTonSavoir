variable "resource_group_name" {
  description = "The name of the resource group"
  type        = string
  default     = "evaluetonsavoir"
}

variable "container_group_app_name" {
  description = "The name of the app container group"
  type        = string
  default     = "evaluetonsavoir-app"
}

variable "container_group_app_dns" {
  description = "The dns name of the app container group"
  type        = string
  default     = "evaluetonsavoir-app"
}

variable "container_group_router_name" {
  description = "The name of the router container group"
  type        = string
  default     = "evaluetonsavoir"
}

variable "container_group_router_dns" {
  description = "The dns name of the router container group"
  type        = string
  default     = "evaluetonsavoir"
}

variable "container_group_os" {
  description = "The os type of the container group"
  type        = string
  default     = "Linux"
}

variable "image_registry_server" {
  description = "The image registry server"
  type        = string
  default     = "index.docker.io"
}

variable "image_registry_user" {
  description = "The image registry username"
  type        = string
  default     = "username"
}

variable "image_registry_password" {
  description = "The image registry password"
  type        = string
  default     = "password"
}

variable "location" {
  description = "The location for resources"
  type        = string
  default     = "Canada Central"
}

variable "frontend_image" {
  description = "Docker image for the frontend"
  type        = string
  default     = "fuhrmanator/evaluetonsavoir-frontend:latest"
}

variable "frontend_image_name" {
  description = "Docker image name for the frontend"
  type        = string
  default     = "frontend"
}

variable "frontend_image_cpu" {
  description = "Docker image cpu for the frontend"
  type        = string
  default     = "1"
}

variable "frontend_image_memory" {
  description = "Docker image memory for the frontend"
  type        = string
  default     = "2"
}

variable "frontend_port" {
  description = "The frontend port"
  type        = number
  default     = 5173
}

variable "backend_image" {
  description = "Docker image for the backend"
  type        = string
  default     = "fuhrmanator/evaluetonsavoir-backend:latest"
}

variable "backend_image_name" {
  description = "Docker image name for the backend"
  type        = string
  default     = "backend"
}

variable "backend_image_cpu" {
  description = "Docker image cpu for the backend"
  type        = string
  default     = "1"
}

variable "backend_image_memory" {
  description = "Docker image memory for the backend"
  type        = string
  default     = "2"
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
  default     = "secret"
}

variable "backend_email_service" {
  description = "The name of the service use for sending email"
  type        = string
  default     = "gmail"
}

variable "backend_email_sender" {
  description = "The email address used to send email"
  type        = string
  default     = "mail@mail.com"
}

variable "backend_email_password" {
  description = "The email password"
  type        = string
  default     = "password"
}

variable "backend_jwt_secret" {
  description = "The secret used to sign the jwt"
  type        = string
  default     = "secret"
}

variable "router_image" {
  description = "Docker image for the router"
  type        = string
  default     = "nginx:alpine"
}

variable "router_image_name" {
  description = "Docker image name for the router"
  type        = string
  default     = "nginx"
}

variable "router_image_cpu" {
  description = "Docker image cpu for the router"
  type        = string
  default     = "1"
}

variable "router_image_memory" {
  description = "Docker image memory for the router"
  type        = string
  default     = "2"
}

variable "router_port" {
  description = "The router port"
  type        = number
  default     = 80
}

variable "router_volume_mount_path" {
  description = "The router volume mount path"
  type        = string
  default     = "/etc/nginx/conf.d"
}

variable "router_volume_share_name" {
  description = "The router volume share name"
  type        = string
  default     = "nginx-config-share"
}

variable "backend_volume_mount_path" {
  description = "The backend volume mount path"
  type        = string
  default     = "/usr/src/app/serveur/config/auth"
}

variable "backend_volume_share_name" {
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
