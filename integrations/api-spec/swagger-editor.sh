#!/bin/bash

docker pull swaggerapi/swagger-editor
docker run -d -p ${EDITOR_PORTMAPPING:-127.0.0.1:8082}:8080 swaggerapi/swagger-editor
