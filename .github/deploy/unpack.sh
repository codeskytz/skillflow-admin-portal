#!/usr/bin/env bash
#
# Runs on the cPanel server, fed to `bash -s` over SSH by the deploy workflow.
#
# This host has no rsync, so the build arrives as a single gzipped archive and
# is unpacked here. Expects DEPLOY_DIR in the environment, e.g.
# "student.skillflowtz.com" — the document root directly under $HOME.
set -e

if [ -z "${DEPLOY_DIR:-}" ]; then
  echo "DEPLOY_DIR is not set" >&2
  exit 1
fi

DOCROOT="$HOME/$DEPLOY_DIR"
ARCHIVE="$HOME/.deploy/$DEPLOY_DIR.tar.gz"
STAGING="$HOME/.deploy/$DEPLOY_DIR.new"
ROLLBACK="$HOME/.deploy/$DEPLOY_DIR.previous.tar.gz"

if [ ! -f "$ARCHIVE" ]; then
  echo "Archive not found at $ARCHIVE" >&2
  exit 1
fi

# Unpack to one side first. A truncated or corrupt upload fails here, while the
# live site is still completely untouched.
rm -rf "$STAGING"
mkdir -p "$STAGING"
tar -xzf "$ARCHIVE" -C "$STAGING"

# Refuse to continue on an archive that is missing the essentials, rather than
# emptying the document root and putting nothing back.
if [ ! -f "$STAGING/index.html" ]; then
  echo "index.html missing from the archive - refusing to deploy" >&2
  rm -rf "$STAGING"
  exit 1
fi
if [ ! -f "$STAGING/.htaccess" ]; then
  echo ".htaccess missing from the archive - SPA routes would 404" >&2
  rm -rf "$STAGING"
  exit 1
fi

mkdir -p "$DOCROOT"

# Keep what is currently live, so a bad release can be put back with one
# command:  tar -xzf ~/.deploy/<domain>.previous.tar.gz -C ~/<domain>
if [ -f "$DOCROOT/index.html" ]; then
  tar -czf "$ROLLBACK" -C "$DOCROOT" . || echo "warning: could not save a rollback copy"
fi

# Clear the previous release, leaving the entries cPanel and Let's Encrypt own.
# Without this every past release's fingerprinted bundles accumulate here
# forever, since their filenames never repeat.
find "$DOCROOT" -mindepth 1 -maxdepth 1 \
  ! -name '.well-known' \
  ! -name 'cgi-bin' \
  ! -name '.htpasswd' \
  -exec rm -rf {} +

# -a preserves permissions; the trailing /. copies the contents including
# dotfiles such as .htaccess, which a bare "$STAGING/*" glob would skip.
cp -a "$STAGING/." "$DOCROOT/"

rm -rf "$STAGING" "$ARCHIVE"

echo "Deployed to $DOCROOT"
ls -la "$DOCROOT" | head -20
