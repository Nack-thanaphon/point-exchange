default: helm-push

# Helm variables
HELM_NAMESPACE ?= line

HELM_CHART_DIR ?= ./
HELM_CHART_NAME ?= line-service
HELM_REGISTRY ?= oci://registry.gitlab.com/contactus.work/hlab-api
HELM_VERSION ?= 1.0.0
HELM_RELEASE_NAME ?= line-service
HELM_VALUES_FILE ?= ./values.yaml

@PHONY: testenv
testenv:
	@echo "$(HELM_NAMESPACE)"
	@echo "$(HELM_RELEASE_NAME)"
	@echo "$(HELM_VALUES_FILE)"

.PHONY: package
package:
	@echo "Packaging Helm chart..."
	helm package $(HELM_CHART_DIR) --version $(HELM_VERSION)

.PHONY: helm-push
helm-push: package
	@echo "Pushing Helm chart..."
	helm push $(HELM_CHART_NAME)-$(HELM_VERSION).tgz $(HELM_REGISTRY)

.PHONY: update
update:
	cd $(HELM_CHART_DIR) && helm dependency update
	
.PHONY: install
install: helm-push
	@echo "Installing Helm to namespace: $(HELM_NAMESPACE)"
	helm upgrade --install --wait --create-namespace \
	--namespace $(HELM_NAMESPACE) $(HELM_RELEASE_NAME) \
	$(HELM_REGISTRY)/$(HELM_CHART_NAME) \
	--version $(HELM_VERSION) \
	-f $(HELM_VALUES_FILE)

.PHONY: uninstall
uninstall:
	helm uninstall -n $(HELM_NAMESPACE) $(HELM_RELEASE_NAME)
