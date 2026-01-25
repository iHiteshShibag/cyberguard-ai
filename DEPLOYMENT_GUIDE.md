# CyberGuard AI - Deployment Guide

## Overview

CyberGuard AI is a production-ready, cloud-native Security Operations Center (SOC) Copilot platform. This guide covers deployment strategies, configuration, and operational best practices.

---

## Architecture Overview

### System Components

1. **Frontend** (React 19 + Tailwind CSS)
   - Single-page application (SPA)
   - Mathematical blueprint aesthetic UI
   - Real-time dashboard and chat interface

2. **Backend** (Express.js + tRPC)
   - RESTful API via tRPC
   - Authentication via Manus OAuth
   - Modular microservice architecture

3. **AI Layer** (Google Gemini LLM)
   - Log Analyzer Agent
   - Threat Classifier Agent
   - Response Planner Agent
   - Report Writer Agent

4. **Data Layer**
   - MySQL/TiDB relational database
   - S3-compatible object storage for logs and reports
   - Vector database for log embeddings (optional)

5. **Infrastructure**
   - Docker containerization
   - Kubernetes orchestration (optional)
   - Google Cloud Run (serverless)

---

## Local Development Setup

### Prerequisites

- Node.js 22.13.0+
- pnpm 10.15.1+
- MySQL 8.0+ or TiDB
- Docker (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/cyberguard-ai/cyberguard-ai.git
cd cyberguard-ai

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Configure database
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/cyberguard_ai

# Authentication
JWT_SECRET=your-secret-key-here
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# LLM Integration
BUILT_IN_FORGE_API_KEY=your-forge-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge

# Storage
AWS_S3_BUCKET=cyberguard-logs
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Application
NODE_ENV=development
VITE_APP_TITLE=CyberGuard AI
VITE_APP_LOGO=/logo.svg
```

---

## Docker Deployment

### Build Docker Image

```dockerfile
# Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Build and Run

```bash
# Build image
docker build -t cyberguard-ai:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://user:password@db:3306/cyberguard_ai \
  -e JWT_SECRET=your-secret \
  cyberguard-ai:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://cyberguard:password@db:3306/cyberguard_ai
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: cyberguard_ai
      MYSQL_USER: cyberguard
      MYSQL_PASSWORD: password
    volumes:
      - db-data:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  db-data:
```

---

## Kubernetes Deployment

### Helm Chart Structure

```yaml
# values.yaml
replicaCount: 3

image:
  repository: cyberguard-ai
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: cyberguard-ai.example.com
      paths:
        - path: /
          pathType: Prefix

database:
  host: mysql.default.svc.cluster.local
  port: 3306
  name: cyberguard_ai

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace cyberguard

# Create secrets
kubectl create secret generic cyberguard-secrets \
  --from-literal=database-url=mysql://user:password@db:3306/cyberguard_ai \
  --from-literal=jwt-secret=your-secret \
  -n cyberguard

# Deploy with Helm
helm install cyberguard ./helm/cyberguard-ai \
  -n cyberguard \
  -f values.yaml
```

---

## Google Cloud Run Deployment

### Build and Push to Google Container Registry

```bash
# Set project ID
export PROJECT_ID=your-gcp-project

# Build image
gcloud builds submit --tag gcr.io/$PROJECT_ID/cyberguard-ai

# Deploy to Cloud Run
gcloud run deploy cyberguard-ai \
  --image gcr.io/$PROJECT_ID/cyberguard-ai \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars DATABASE_URL=mysql://user:password@db:3306/cyberguard_ai \
  --allow-unauthenticated
```

### Cloud SQL Integration

```bash
# Create Cloud SQL instance
gcloud sql instances create cyberguard-db \
  --database-version MYSQL_8_0 \
  --tier db-f1-micro \
  --region us-central1

# Create database
gcloud sql databases create cyberguard_ai \
  --instance cyberguard-db

# Create user
gcloud sql users create cyberguard \
  --instance cyberguard-db \
  --password=your-password
```

---

## Production Configuration

### Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use secret management (HashiCorp Vault, AWS Secrets Manager)
   - Rotate secrets regularly

2. **Database**
   - Enable SSL/TLS connections
   - Use strong passwords
   - Enable automated backups
   - Implement read replicas for high availability

3. **API Security**
   - Enable CORS restrictions
   - Implement rate limiting
   - Use HTTPS/TLS everywhere
   - Validate all inputs

4. **Logging & Monitoring**
   - Enable application logging
   - Set up centralized log aggregation (ELK, Datadog)
   - Monitor API performance and errors
   - Set up alerts for critical events

### Performance Optimization

1. **Caching**
   - Enable Redis caching for frequently accessed data
   - Cache threat classifications and MITRE mappings
   - Implement cache invalidation strategies

2. **Database**
   - Create indexes on frequently queried columns
   - Implement connection pooling
   - Use read replicas for analytics queries

3. **Frontend**
   - Enable gzip compression
   - Implement code splitting
   - Use CDN for static assets
   - Enable browser caching

### Scaling Strategy

1. **Horizontal Scaling**
   - Deploy multiple application instances
   - Use load balancer (nginx, AWS ALB)
   - Implement session affinity if needed

2. **Vertical Scaling**
   - Increase CPU/memory for high-load scenarios
   - Monitor resource utilization

3. **Database Scaling**
   - Use read replicas for read-heavy workloads
   - Implement sharding for very large datasets
   - Consider managed database services

---

## Monitoring & Observability

### Key Metrics to Monitor

1. **Application Metrics**
   - Request latency (p50, p95, p99)
   - Error rate
   - Throughput (requests/second)
   - Active connections

2. **Business Metrics**
   - Threats detected per day
   - Average risk score
   - Report generation time
   - Chat response time

3. **Infrastructure Metrics**
   - CPU utilization
   - Memory usage
   - Disk I/O
   - Network bandwidth

### Alerting Rules

```yaml
# Example Prometheus alerts
groups:
  - name: cyberguard-ai
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
        for: 5m
        annotations:
          summary: "High API latency detected"

      - alert: DatabaseConnectionError
        expr: database_connection_errors_total > 0
        for: 1m
        annotations:
          summary: "Database connection error"
```

---

## Backup & Disaster Recovery

### Database Backups

```bash
# MySQL backup
mysqldump -u cyberguard -p cyberguard_ai > backup.sql

# Automated backup (daily)
0 2 * * * mysqldump -u cyberguard -p cyberguard_ai | gzip > /backups/cyberguard_$(date +\%Y\%m\%d).sql.gz
```

### S3 Backup

```bash
# Sync logs to backup bucket
aws s3 sync s3://cyberguard-logs s3://cyberguard-logs-backup --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket cyberguard-logs \
  --versioning-configuration Status=Enabled
```

### Recovery Procedures

1. **Database Recovery**
   - Stop application
   - Restore from backup
   - Verify data integrity
   - Restart application

2. **S3 Recovery**
   - Use S3 versioning to restore previous versions
   - Restore from backup bucket if needed

---

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:3306
   Solution: Verify DATABASE_URL, ensure MySQL is running
   ```

2. **LLM API Error**
   ```
   Error: Invalid API key
   Solution: Verify BUILT_IN_FORGE_API_KEY, check API quota
   ```

3. **S3 Upload Error**
   ```
   Error: Access Denied
   Solution: Verify AWS credentials, check bucket permissions
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=cyberguard-ai:* pnpm dev

# Check environment
node -e "console.log(process.env)"
```

---

## Maintenance

### Regular Tasks

- **Daily**: Monitor error logs, check system health
- **Weekly**: Review performance metrics, backup verification
- **Monthly**: Security patches, dependency updates
- **Quarterly**: Capacity planning, disaster recovery drills

### Upgrade Procedure

```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Run migrations
pnpm db:push

# Build and deploy
pnpm build
docker build -t cyberguard-ai:v2.0 .
docker push gcr.io/$PROJECT_ID/cyberguard-ai:v2.0

# Update deployment
kubectl set image deployment/cyberguard-ai \
  cyberguard-ai=gcr.io/$PROJECT_ID/cyberguard-ai:v2.0 \
  -n cyberguard
```

---

## Support & Resources

- **Documentation**: https://docs.cyberguard-ai.com
- **API Reference**: See API_DOCUMENTATION.md
- **GitHub Issues**: https://github.com/cyberguard-ai/cyberguard-ai/issues
- **Email Support**: support@cyberguard-ai.com
