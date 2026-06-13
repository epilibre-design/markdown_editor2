<?php
declare(strict_types=1);

// Bootstrap des tests unitaires : aucun SPIP réel, uniquement des stubs.
// Les fonctions SPIP utilisées par le code testé sont mockées ici, et
// pilotées depuis les tests via les globales $_test_*.

if (!defined('_ECRIRE_INC_VERSION')) {
    // markdown_editor_pipelines.php fait un `return` précoce sans cette constante
    define('_ECRIRE_INC_VERSION', 'test');
}

if (!function_exists('include_spip')) {
    function include_spip(string $path): bool { return true; }
}

if (!function_exists('_T')) {
    // Retourne la clé telle quelle : permet d'asserter la présence des libellés
    function _T(string $key, array $args = []): string { return $key; }
}

if (!function_exists('_request')) {
    function _request(string $name): mixed {
        return $GLOBALS['_test_request'][$name] ?? null;
    }
}

if (!function_exists('test_espace_prive')) {
    function test_espace_prive(): bool {
        return (bool) ($GLOBALS['_test_espace_prive'] ?? true);
    }
}

if (!function_exists('autoriser')) {
    function autoriser(string $faire, string $type = '', $id = 0, $qui = null, $opt = []): bool {
        return (bool) ($GLOBALS['_test_autoriser'] ?? false);
    }
}
