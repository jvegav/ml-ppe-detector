# Construction Site PPE Detection System (ml-ppe-detector)

A safety monitoring platform for construction sites designed for real-time detection of Personal Protective Equipment (PPE) compliance—such as hard hats, high-visibility vests, and safety gloves—using surveillance camera video streams.

## Case Study

The primary goal is to reduce workplace accidents in construction environments by automating safety oversight. The system ingests image and video streams from on-site cameras, detects non-compliance with mandatory protective gear, and delivers controlled notifications to site supervisors.

## System Architecture

### 1. Computer Vision & Detection
- **Model:** YOLOv8 (or Detectron2) fine-tuned for multi-class detection of PPE items (hard hats, safety vests, gloves) and workers.
- **Input:** Video frames or static images.
- **Output:** Bounding box coordinates, class labels, and detection confidence scores.

### 2. Backend Microservices
- **Inference Service (`ms-inference`):** Exposes REST (FastAPI) or gRPC endpoints to receive video frames, run inference against the model, and return detection results in real time.
- **Authentication Service (`ms-auth`):** Manages user authentication and authorization using OAuth2 and JWT tokens, restricting dashboard access to authorized supervisors.
- **Alert Service:** Dispatches notifications whenever safety violations are detected. Uses Redis for rate limiting to prevent notification flooding.
- **Web Application (`webapp`):** Supervisor dashboard for viewing real-time detections, worker compliance metrics, and incident history.

### 3. MLOps Pipeline
- **Versioning:** Model registry and dataset version control powered by MLflow or DVC.
- **Retraining Pipeline:** Continuous retraining triggered when newly labeled site images become available.
- **Drift Monitoring:** Tracks model degradation and concept drift (e.g., raises an alert if average detection confidence drops over time).

## Infrastructure & Deployment

- **Containers:** All components are packaged as standalone Docker containers.
- **Orchestration:** Managed via Docker Compose for local development, with support for Kubernetes (K8s) deployment in production environments.

## Repository Structure

```text
.
├── ms-auth/          # Authentication and authorization service (OAuth2/JWT)
├── ms-inference/     # Vision model inference service
├── webapp/           # Web frontend and supervisor dashboard
└── README.md         # Project documentation
```