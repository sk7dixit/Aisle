provider "aws" {
  region = var.aws_region
}

# -------------------------------------------------------------
# VPC and Network Infrastructures
# -------------------------------------------------------------
resource "aws_vpc" "aisle_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "aisle-vpc-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.aisle_vpc.id
}

# Public Subnets (For Load Balancer)
resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.aisle_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.aisle_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  map_public_ip_on_launch = true
}

# Private Subnets (For App Cluster & DB)
resource "aws_subnet" "private_app_1" {
  vpc_id            = aws_vpc.aisle_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"
}

resource "aws_subnet" "private_app_2" {
  vpc_id            = aws_vpc.aisle_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"
}

# -------------------------------------------------------------
# Security Groups (Network Access Controls - POLP)
# -------------------------------------------------------------

# Load Balancer Security Group (Exposed to Internet)
resource "aws_security_group" "lb_sg" {
  name        = "aisle-lb-sg-${var.environment}"
  description = "Allow HTTPS inbound to load balancer"
  vpc_id      = aws_vpc.aisle_vpc.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Application Servers Security Group (Private - accessible ONLY via LB)
resource "aws_security_group" "app_sg" {
  name        = "aisle-app-sg-${var.environment}"
  description = "Restricted to Application Load Balancer only"
  vpc_id      = aws_vpc.aisle_vpc.id

  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.lb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Database Security Group (Isolated - accessible ONLY via App subnets)
resource "aws_security_group" "db_sg" {
  name        = "aisle-db-sg-${var.environment}"
  description = "MongoDB cluster port access control"
  vpc_id      = aws_vpc.aisle_vpc.id

  ingress {
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  # Completely isolate database egress to secure private subnet boundaries
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
  }
}

# -------------------------------------------------------------
# AWS DocumentDB / MongoDB Cluster Setup
# -------------------------------------------------------------
resource "aws_docdb_subnet_group" "db_subnet_group" {
  name       = "aisle-db-subnet-group-${var.environment}"
  subnet_ids = [aws_subnet.private_app_1.id, aws_subnet.private_app_2.id]
}

resource "aws_docdb_cluster" "docdb" {
  cluster_identifier      = "aisle-docdb-cluster-${var.environment}"
  engine                  = "docdb"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = 30
  preferred_backup_window = "07:00-09:00"
  skip_final_snapshot     = true
  db_subnet_group_name    = aws_docdb_subnet_group.db_subnet_group.name
  vpc_security_group_ids  = [aws_security_group.db_sg.id]
}

resource "aws_docdb_cluster_instance" "cluster_instances" {
  count              = 2
  identifier         = "aisle-docdb-instance-${count.index}-${var.environment}"
  cluster_identifier = aws_docdb_cluster.docdb.id
  instance_class     = "db.r5.large"
}

# -------------------------------------------------------------
# Load Balancer & Auto-Scaling Target Groups
# -------------------------------------------------------------
resource "aws_lb" "app_lb" {
  name               = "aisle-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

resource "aws_lb_target_group" "app_tg" {
  name     = "aisle-app-tg-${var.environment}"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = aws_vpc.aisle_vpc.id

  health_check {
    path                = "/health"
    port                = "5000"
    protocol            = "HTTP"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}
