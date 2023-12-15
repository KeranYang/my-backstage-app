# How to enable the kubernetes plugin for an entity

Reference: https://backstage.io/docs/features/kubernetes/

## Step one: install front-end and back-end plugin
* Follow https://backstage.io/docs/features/kubernetes/installation#adding-the-kubernetes-frontend-plugin to install front-end.
* Follow https://backstage.io/docs/features/kubernetes/installation#adding-kubernetes-backend-plugin to install back-end.
* Don't need to follow https://backstage.io/docs/features/kubernetes/installation#custom-cluster-discovery just yet.

***To verify this change***, create a `service` entity, you should be able to see the kubernetes tab.

## Step two: configure kubernetes clusters
In my case, I configured my local kind cluster. Below is the configuration:

```yaml
kubernetes:
  serviceLocatorMethod:
    type: 'multiTenant'
  clusterLocatorMethods:
    - type: 'config'
      clusters:
        - name: 'local-kind'
          url: 'https://127.0.0.1:49872'
          authProvider: 'serviceAccount'
          skipMetricsLookup: true
          skipTLSVerify: true
          serviceAccountToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Il9uTV9QTU9rM29ETVJmaGducVA0S2I5MVhnWXp3d1k3TGdrTlhrdDgwd0EifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImJhY2tzdGFnZS1zYS1zZWNyZXQiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiYmFja3N0YWdlLXNhIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiMjE4ZDVmZjAtNThhZi00OGI5LWJhZmEtMGE4MTFjNzJlZDkwIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmRlZmF1bHQ6YmFja3N0YWdlLXNhIn0.ZEmDFX4xlz2lSn0YHxTZY9GOGA1skOqG9vg9fJNKoQXAsCXBnrk61tYmRcttaGsZv5jwt5tpeEvZhtqNOzJz82hNBFJYBsDl1A9bqBEzZEZiDg2MW4N06Z94rBGnaCpnlICAaFU-bXnzVXYn0QIwWv896mUuKWUOwJpYDCqP336Myr2ca-6JvjVT_Si-BsQpefKKah39_KOwqaO-dqEz9freY00dOR4xVAQC5AXlFxlGItZSqXSjHrw1fBZL2EyLaURkXYCNzyb0dGQNwcB9Jk7wuu6Fm5uoW1MkbWTjBQX1L6kJ3Yd75yQIisHF9R574cCBLaAI3A0wCmERd56NUg'
```
To learn about each field, read https://backstage.io/docs/features/kubernetes/configuration.

*how to get the url*: In my case, my kind cluster runs on docker desktop. It's exposed to my local machine at https://127.0.0.1:49872. I got the exact url by running `kubectl cluster-info` and copy the server url.

*how to configure authentication*: I choose to use service account token to authenticate with the cluster.

* Create a service account named `backstage-sa` in the `default` namespace
`kubectl create serviceaccount backstage-sa -n default`
* Create a cluster role binding for the service account, give it `cluster-admin` role
`kubectl create clusterrolebinding backstage-sa-binding --clusterrole=cluster-admin --serviceaccount=default:backstage-sa`
* Create a secret for the service account
```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: backstage-sa-secret
  namespace: default
  annotations:
    kubernetes.io/service-account.name: backstage-sa
type: kubernetes.io/service-account-token
EOF
```
* Retrieve the token for the service account
`kubectl get secret backstage-sa-secret -n default -o jsonpath="{.data.token}" | base64 --decode`

***To verify this step***, run the following command to see if you can use the token to send request to the cluster.

```bash
curl -k -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Il9uTV9QTU9rM29ETVJmaGducVA0S2I5MVhnWXp3d1k3TGdrTlhrdDgwd0EifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImJhY2tzdGFnZS1zYS1zZWNyZXQiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiYmFja3N0YWdlLXNhIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiMjE4ZDVmZjAtNThhZi00OGI5LWJhZmEtMGE4MTFjNzJlZDkwIiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50OmRlZmF1bHQ6YmFja3N0YWdlLXNhIn0.ZEmDFX4xlz2lSn0YHxTZY9GOGA1skOqG9vg9fJNKoQXAsCXBnrk61tYmRcttaGsZv5jwt5tpeEvZhtqNOzJz82hNBFJYBsDl1A9bqBEzZEZiDg2MW4N06Z94rBGnaCpnlICAaFU-bXnzVXYn0QIwWv896mUuKWUOwJpYDCqP336Myr2ca-6JvjVT_Si-BsQpefKKah39_KOwqaO-dqEz9freY00dOR4xVAQC5AXlFxlGItZSqXSjHrw1fBZL2EyLaURkXYCNzyb0dGQNwcB9Jk7wuu6Fm5uoW1MkbWTjBQX1L6kJ3Yd75yQIisHF9R574cCBLaAI3A0wCmERd56NUg" https://127.0.0.1:49872
```

## Step three: configure kubernetes entities
Here is how a kubernetes object is associated with a backstage entity:
* The kubernetes object must have a label `backstage.io/kubernetes-id` with a value.
* The backstage entity must have a `metadata.annotations` field with a key `backstage.io/kubernetes-id` and a value that matches the label value of the kubernetes object.

***To verify this step***, create a `deployment` object in your cluster, and add the label and annotation to the object and the entity respectively. You should be able to see the deployment in the kubernetes tab of the entity.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-hello-world-deployment
  labels:
    app: go-hello-world-app
    backstage.io/kubernetes-id: go-hello-world
spec:
  replicas: 1
  selector:
    matchLabels:
      app: go-hello-world-app
  template:
    metadata:
      labels:
        app: go-hello-world-app
        backstage.io/kubernetes-id: go-hello-world
    spec:
      containers:
        - name: go-hello-world
          image: quay.io/keranyang/go-hello-world:v1.0.1
          imagePullPolicy: Always
```
The corresponding entity configuration:
```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: example-service
  annotations:
    # In order for Backstage to detect that an entity has Kubernetes components,
    # the following annotation should be added
    'backstage.io/kubernetes-id': go-hello-world
    'backstage.io/kubernetes-namespace': default
spec:
  type: service
  lifecycle: experimental
  owner: numaflow-developers
  system: examples
  providesApis: [example-grpc-api]
```

## Step four: view the kubernetes object in the entity page
![cluster-display](screenshots/cluster-display.png)
