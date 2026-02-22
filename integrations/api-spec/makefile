SERVER_PATH:=$(CURDIR)/../internal/generated_server
SERVER_CLIENT_PATH:=$(CURDIR)/../app-ui/src/client/server-api
SERVER_DOC_PATH:=$(CURDIR)/../docs/server-api
MEMORY_CLIENT_PATH:=$(CURDIR)/../internal/generated_client/memory_services
CAREER_CLIENT_PATH:=$(CURDIR)/../internal/generated_client/career_services
HONEYCOMB_CLIENT_PATH:=$(CURDIR)/../internal/generated_client/honeycomb_services


# overrideable default values
GENERATOR_IMAGE:=openapitools/openapi-generator-cli
GENERATOR_TAG:=v7.12.0

.PHONY: clean server-api server-api-client server-doc memory-services-client career-services-client honeycomb-services-client

all: clean server-api server-api-client server-doc memory-services-client career-services-client honeycomb-services-client

clean:
	rm -rf $(SERVER_PATH)
	rm -rf $(SERVER_CLIENT_PATH)
	rm -rf $(SERVER_DOC_PATH)

server-api-client:
	docker run --rm -v "./:/temporary-api" -v "$(SERVER_CLIENT_PATH):/generated" $(GENERATOR_IMAGE):$(GENERATOR_TAG) generate \
		-i /temporary-api/server.yml \
		--additional-properties=typescriptThreePlus=true \
		--additional-properties=modelPropertyNaming=original \
		--additional-properties=supportsES6=true \
		--additional-properties=platform=node \
		-o /generated \
		-g typescript-fetch
	./scripts/fix-ts-fetch-lint.sh $(SERVER_CLIENT_PATH)

server-api:
	docker run --rm -v "./:/temporary-api" -v "$(SERVER_PATH):/generated" $(GENERATOR_IMAGE):$(GENERATOR_TAG) generate \
		-i /temporary-api/server.yml \
		--additional-properties=packageName=api \
		--git-host git.dev.celloon.de \
		--git-repo-id maind.rec-backend/internal/generated_server \
		--git-user-id celloon/maindset.academy \
		-o /generated \
		-g go-echo-server
	rm -f $(SERVER_PATH)/go.mod

memory-services-client:
	docker run --rm -v "./:/temporary-api" -v "$(MEMORY_CLIENT_PATH):/generated" $(GENERATOR_IMAGE):$(GENERATOR_TAG) generate \
		-i /temporary-api/memory-services.yml \
		--additional-properties=disallowAdditionalPropertiesIfNotPresent=additionalProperties \
		--additional-properties=packageName=memory_services \
		--additional-properties=isGoSubmodule=true \
		--additional-properties=withGoMod=false \
		--git-host git.dev.celloon.de \
		--git-repo-id maind.rec-backend/internal/generated_client \
		--git-user-id celloon/maindset.academy \
		-o /generated \
		-g go
	rm -f $(MEMORY_CLIENT_PATH)/go.mod
	rm -f $(MEMORY_CLIENT_PATH)/go.sum

career-services-client:
	docker run --rm -v "./:/temporary-api" -v "$(CAREER_CLIENT_PATH):/generated" $(GENERATOR_IMAGE):$(GENERATOR_TAG) generate \
		-i /temporary-api/career-services.yml \
		--additional-properties=disallowAdditionalPropertiesIfNotPresent=additionalProperties \
		--additional-properties=packageName=career_services \
		--additional-properties=isGoSubmodule=true \
		--additional-properties=withGoMod=false \
		--git-host git.dev.celloon.de \
		--git-repo-id maind.rec-backend/internal/generated_client \
		--git-user-id celloon/maindset.academy \
		-o /generated \
		-g go
	rm -f $(CAREER_CLIENT_PATH)/go.mod
	rm -f $(CAREER_CLIENT_PATH)/go.sum

honeycomb-services-client:
	docker run --rm -v "./:/temporary-api" -v "$(HONEYCOMB_CLIENT_PATH):/generated" $(GENERATOR_IMAGE):$(GENERATOR_TAG) generate \
		-i /temporary-api/honeycomb-services.yml \
		--additional-properties=disallowAdditionalPropertiesIfNotPresent=additionalProperties \
		--additional-properties=packageName=honeycomb_services \
		--additional-properties=isGoSubmodule=true \
		--additional-properties=withGoMod=false \
		--git-host git.dev.celloon.de \
		--git-repo-id maind.rec-backend/internal/generated_client \
		--git-user-id celloon/maindset.academy \
		-o /generated \
		-g go
	rm -f $(HONEYCOMB_CLIENT_PATH)/go.mod
	rm -f $(HONEYCOMB_CLIENT_PATH)/go.sum

server-doc:
	docker run --rm -v "./:/temporary-api" -v "$(SERVER_DOC_PATH):/generated" $(GENERATOR_IMAGE):$(GENERATOR_TAG) generate \
		-i /temporary-api/server.yml \
		--additional-properties=typescriptThreePlus=true \
		--additional-properties=modelPropertyNaming=original \
		--additional-properties=supportsES6=true \
		--additional-properties=platform=node \
		-o /generated \
		-g html