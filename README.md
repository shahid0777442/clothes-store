# Clothes Store: Automated IaC and Orchestration

Online clothes store (Node.js + Express + MongoDB) deployed on Kubernetes, with the network and
cluster described as code using Terraform and a CI/CD pipeline on GitHub Actions.

## Architecture

```
Users -> NGINX Ingress -> Service clothes-app -> App pods (HPA: 2 to 6) -> Service mongo -> MongoDB pod -> PVC (5Gi)
```

| Layer | Technology |
|---|---|
| Application | Node.js 20, Express, Mongoose |
| Database | MongoDB 7 with a PersistentVolumeClaim |
| Containers | Docker, docker-compose |
| Infrastructure as Code | Terraform (AWS VPC, subnets, NAT, EKS) |
| Orchestration | Kubernetes: Deployments, Services, Ingress, HPA |
| CI/CD | GitHub Actions, GitHub Container Registry |

## Repository layout

```
app/          Node.js app, frontend and Dockerfile
k8s/          Namespace, MongoDB + PVC, app, Ingress, HPA
terraform/    VPC, subnets, NAT gateway, EKS cluster
.github/      CI/CD workflow
docs/         Deployment screenshots
```

## Run locally

```bash
docker compose up --build
# open http://localhost:3000
```

## Deploy to Kubernetes (Minikube)

```bash
minikube start --cpus=2 --memory=4096
minikube addons enable ingress
minikube addons enable metrics-server

# edit k8s/20-app.yaml: replace YOUR_GITHUB_USERNAME with your GitHub username
kubectl apply -f k8s/
kubectl get pods,pvc,ingress,hpa -n clothes-store
```

## Provision AWS infrastructure (Terraform)

```bash
cd terraform
terraform init
terraform plan
terraform apply
$(terraform output -raw kubeconfig_cmd)
```

Destroy when finished to avoid charges: `terraform destroy`.

## CI/CD

The workflow in `.github/workflows/ci-cd.yml` runs on every push and pull request:

1. `terraform-validate`: terraform init, validate and fmt check
2. `build-push`: builds the Docker image and pushes it to `ghcr.io/<owner>/clothes-store` (main only)
3. `deploy` (optional): runs `kubectl apply -f k8s/` when the repository variable `ENABLE_DEPLOY` is `true`
   and the secrets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set

After the first run, set the package visibility to Public so the cluster can pull the image.

## Autoscaling test

```bash
kubectl get hpa -n clothes-store -w
kubectl run load --rm -it --image=busybox -n clothes-store -- sh -c \
  "while true; do wget -q -O- http://clothes-app/api/load; done"
```

## Deployment evidence

| Screenshot | What it shows |
|---|---|
<img width="1906" height="817" alt="Screenshot 2026-11-24 021801" src="https://github.com/user-attachments/assets/65a55f63-058d-4fc5-a233-380b303435ca" />
<img width="1906" height="807" alt="Screenshot 2026-11-24 021957" src="https://github.com/user-attachments/assets/42a99532-994b-477b-81da-c75990f55cef" />
<img width="1906" height="817" alt="2nd order" src="https://github.com/user-attachments/assets/fb8de1a1-a947-4046-9759-adb350bc4259" />
<img width="720" height="309" alt="Picture1" src="https://github.com/user-attachments/assets/3b298fbf-e409-47ab-864e-15fed68788b1" />
<img width="720" height="300" alt="pods" src="https://github.com/user-attachments/assets/c2c117e6-3d99-4599-8481-e94c6388d8a8" />
<img width="1711" height="482" alt="Screenshot 2026-11-24 050135" src="https://github.com/user-attachments/assets/252f7245-e388-4d32-b2e1-f9ebcfc07330" />



