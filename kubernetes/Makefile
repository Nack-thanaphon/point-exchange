default: helm-push

HARBOR_USERNAME ?= clinic
HARBOR_PASSWORD ?= $(shell bash -c 'read -s -p "Registry Password: " pwd; echo $$pwd')
CLUSTER_NAME ?= local
CLUSTER_USER ?= local

# Helm variables
HELM_NAMESPACE ?= clinic

HELM_CHART_DIR ?= ./clinic
HELM_CHART_NAME ?= clinic
HELM_REGISTRY ?= oci://registry.gitlab.com/contactus.work/
HELM_VERSION ?= 1.0.0
HELM_RELEASE_NAME ?= $(HELM_NAMESPACE)
HELM_VALUES_FILE ?= ./clinic-api/values.yaml

@PHONY: testenv
testenv:
	@echo "$(HELM_NAMESPACE)"
	@echo "$(HELM_RELEASE_NAME)"
	@echo "$(HELM_VALUES_FILE)"


.PHONY: init
init: create-context cp-gitlab-secret
	helm repo add mongodb https://mongodb.github.io/helm-charts

.PHONY: create_namespace
create-namespace:
	kubectl get namespace $(HELM_NAMESPACE) >/dev/null 2>&1 || kubectl create namespace $(HELM_NAMESPACE)

.PHONY: create-context
create-context: create-namespace
	kubectl config set-context $(HELM_NAMESPACE) --namespace=$(HELM_NAMESPACE) \
	--cluster=$(CLUSTER_NAME) \
	--user=$(CLUSTER_USER)

	kubectl config use-context $(HELM_NAMESPACE)

.PHONY: create-gitlab-secret
create-gitlab-secret:
	@clear
	@kubectl -n $(HELM_NAMESPACE) \
		create secret docker-registry gitlab-registry-secret \
		--docker-server=registry.gitlab.com \
		--docker-username=$(HARBOR_USERNAME) \
		--docker-email=test@local.com \
		--docker-password=$(HARBOR_PASSWORD)
	
.PHONY: cp-gitlab-secret
cp-gitlab-secret:
	git submodule update --init --recursive
	git submodule foreach git pull origin main
	kubectl get secret gitlab-registry-secret -n $(HELM_NAMESPACE) -o json \
			| jq 'del(.metadata["namespace","creationTimestamp","resourceVersion","selfLink","uid"])' \
			| kubectl apply -n $(HELM_NAMESPACE) -f -git clone --recurse-submodules -j8 git@ssh.zi-github.com:ccdc-projects/clinic-api.git


