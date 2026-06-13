#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SPIP_ROOT="$ROOT_DIR/vendor/spip/spip"
SPIP_BIN="$ROOT_DIR/vendor/bin/spip"
DEPOT_PRINCIPAL="https://plugins.spip.net/depots/principal.xml"
PLUGIN_PREFIX="markdown_editor"
PLUGIN_DEPS="markdown yaml saisies verifier"

is_plugin_active() {
    "$SPIP_BIN" plugins:lister | grep -Eiq "^[[:space:]]*$1[[:space:]]"
}

activate_or_install_plugin() {
    plugin_prefix="$1"
    is_plugin_active "$plugin_prefix" && return 0
    "$SPIP_BIN" plugins:activer "$plugin_prefix" -y && is_plugin_active "$plugin_prefix" && return 0
    echo "Downloading $plugin_prefix via SVP..." >&2
    "$SPIP_BIN" plugins:svp:telecharger "$plugin_prefix" -y || true
    "$SPIP_BIN" plugins:activer "$plugin_prefix" -y || true
    is_plugin_active "$plugin_prefix"
}

mkdir -p "$ROOT_DIR/vendor/spip"

# Patch spip-cli : la version publiée a un bug qui empêche le téléchargement
# de plugins via SVP (cf. MR 91 de spip-contrib-outils/spip-cli). On l'applique
# de façon idempotente sur la copie installée par composer.
SPIP_CLI_DIR="$ROOT_DIR/vendor/spip/spip-cli"
SPIP_CLI_PATCH="$ROOT_DIR/scripts/spip-cli-mr91.patch"
if [ -f "$SPIP_CLI_PATCH" ] && [ -d "$SPIP_CLI_DIR" ]; then
    if patch -p1 -d "$SPIP_CLI_DIR" --dry-run --silent < "$SPIP_CLI_PATCH" >/dev/null 2>&1; then
        patch -p1 -d "$SPIP_CLI_DIR" < "$SPIP_CLI_PATCH"
        echo "Patch spip-cli (MR 91) appliqué."
    else
        echo "Patch spip-cli déjà appliqué (ou non applicable) — ignoré."
    fi
fi

if [ ! -f "$SPIP_ROOT/ecrire/inc_version.php" ]; then
    "$SPIP_BIN" core:telecharger -d "$SPIP_ROOT" -b 4.4
fi

cd "$SPIP_ROOT"
"$SPIP_BIN" core:preparer
SPIP_BIN_SPIP() { (cd "$SPIP_ROOT" && "$ROOT_DIR/vendor/bin/spip" "$@"); }

if [ ! -f "$SPIP_ROOT/config/connect.php" ]; then
    SPIP_BIN_SPIP core:installer \
        --db-server=sqlite3 \
        --db-host='' --db-login='' --db-pass='' \
        --db-database='spip_test' \
        --db-prefix=spip \
        --admin-nom='Admin Test' \
        --admin-login='admin' \
        --admin-email='admin@example.test' \
        --admin-pass='adminadmin' \
        --adresse-site='http://localhost'
fi

SPIP_BIN_SPIP plugins:svp:depoter "$DEPOT_PRINCIPAL" || true

# SVP télécharge les dépendances dans plugins/auto/ : ce dossier doit exister
# et être accessible en écriture.
mkdir -p "$SPIP_ROOT/plugins/auto"

# Rendre le plugin disponible via un symlink dans le répertoire plugins/ de SPIP
PLUGIN_LINK="$SPIP_ROOT/plugins/$PLUGIN_PREFIX"
if [ ! -L "$PLUGIN_LINK" ]; then
    mkdir -p "$SPIP_ROOT/plugins"
    ln -sf "$ROOT_DIR" "$PLUGIN_LINK"
    echo "Symlink créé : $PLUGIN_LINK -> $ROOT_DIR"
fi

for plugin_dep in $PLUGIN_DEPS; do
    activate_or_install_plugin "$plugin_dep" || { echo "Failed: $plugin_dep" >&2; exit 1; }
done

SPIP_BIN_SPIP plugins:activer "$PLUGIN_PREFIX" -y
echo "Integration environment ready."
