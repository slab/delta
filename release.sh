#!/bin/bash

set -eo pipefail

PACKAGE=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")

if [ -n "$(npm view "$PACKAGE@$VERSION" version 2> /dev/null)" ]
then
  echo "Version $VERSION already published."
  exit 0
fi

if [ -n "$(npm view "$PACKAGE@>$VERSION" version 2> /dev/null)" ]
then
  COMMIT=$(git rev-parse HEAD)
  BRANCH_TIP=$(git ls-remote --exit-code origin "${GITHUB_REF:?}" | cut -f1)

  if [ "$COMMIT" != "$BRANCH_TIP" ]
  then
    echo "Version $VERSION superseded by a newer published version."
    exit 0
  fi
fi

git config --local user.email "github@reedsy.com"
git config --local user.name "GitHub Action"

echo "Publishing version $VERSION"
echo '!/dist' >> .gitignore

git checkout -B "release-$VERSION"
git add .gitignore
git add --all dist/
git commit --message "Release version $VERSION"

npm publish --tag latest

if ! git tag "$VERSION" || ! git push origin "refs/tags/$VERSION"
then
  echo "Published $VERSION but could not tag it." >&2
fi
