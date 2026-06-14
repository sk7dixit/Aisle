variable "aws_region" {
  type        = string
  description = "AWS deployment region"
  default     = "ap-south-1"
}

variable "environment" {
  type        = string
  description = "Target environment name (e.g. staging, prod)"
  default     = "staging"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type for backend nodes"
  default     = "t3.medium"
}

variable "db_username" {
  type        = string
  description = "Database administrator username"
  default     = "aisle_admin"
}

variable "db_password" {
  type        = string
  description = "Database administrator password"
  sensitive   = true
}
