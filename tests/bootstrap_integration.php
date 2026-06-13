<?php
declare(strict_types=1);

// Bootstrap des tests d'intégration : charge un vrai SPIP installé dans
// vendor/spip/spip (cf. scripts/install-spip-test.sh) et active le plugin.
// markdown_editor n'a pas de fichier _administrations.php : pas de bloc
// d'upgrade de meta à dérouler ici.

$spipRoot = dirname(__DIR__) . '/vendor/spip/spip';

if (!defined('_SPIP_TEST_INC'))   { define('_SPIP_TEST_INC',   $spipRoot); }
if (!defined('_SPIP_TEST_CHDIR')) { define('_SPIP_TEST_CHDIR', $spipRoot); }

putenv('APP_ENV=test');
chdir($spipRoot);

if (is_file($spipRoot . '/vendor/autoload.php')) {
    require_once $spipRoot . '/vendor/autoload.php';
}
require_once $spipRoot . '/ecrire/inc_version.php';

include_spip('inc/plugin');
_chemin(dirname(__DIR__));
actualise_plugins_actifs();

include_spip('inc/meta');
lire_metas();
