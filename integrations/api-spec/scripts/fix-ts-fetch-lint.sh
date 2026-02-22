#!/bin/bash

## This script is used to suppress the lint error in the generated typescript fetch client
## see https://github.com/OpenAPITools/openapi-generator/issues/8961

cd $1

SED_COMMAND='1s;^;// @ts-nocheck\n;'
if [ "$(uname)" != "Darwin" ]; then
  sed -i "$SED_COMMAND" $TARGET**/*.ts
else
  sed -i '' "$SED_COMMAND" $TARGET**/*.ts
fi
