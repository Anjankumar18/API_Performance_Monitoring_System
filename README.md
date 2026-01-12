# API Performance Monitoring System

A production-style backend system that monitors API latency, errors, and performance metrics in real time.

## Features
- Global middleware-based API monitoring
- Metrics aggregation (error rate, slow APIs, p95 latency)
- Redis caching for scalable reads
- Scheduled alerting with email notifications
- PostgreSQL + Prisma ORM
- Dockerized infrastructure (Postgres, Redis)

## Tech Stack
- Node.js, NestJS
- PostgreSQL, Prisma
- Redis
- Docker
- Nodemailer

## Architecture
- Middleware captures request metrics
- Metrics stored in PostgreSQL
- Redis used for caching and alert deduplication
- Cron-based alerting for SLA breaches

## Run Locally
```bash
docker compose up -d
npm install
npm run start:dev
