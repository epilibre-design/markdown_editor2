<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Vérifie que l'environnement SPIP est bien bootstrappé et que le plugin
 * markdown_editor y est actif.
 */
final class PluginActiveTest extends TestCase
{
    public function testSpipEstBootstrappe(): void
    {
        $this->assertTrue(defined('_SPIP_TEST_INC'), 'Bootstrap SPIP non chargé');
        $this->assertTrue(defined('_ECRIRE_INC_VERSION'), 'SPIP core non initialisé');
    }

    public function testPluginEstActif(): void
    {
        include_spip('inc/plugin');
        $plugins = liste_plugin_actifs();
        $prefixes = array_map('strtolower', array_keys($plugins));
        $this->assertContains('markdown_editor', $prefixes, 'Le plugin markdown_editor n\'est pas actif');
    }

    public function testDependancesActives(): void
    {
        include_spip('inc/plugin');
        $prefixes = array_map('strtolower', array_keys(liste_plugin_actifs()));
        foreach (['markdown', 'yaml', 'saisies', 'verifier'] as $dep) {
            $this->assertContains($dep, $prefixes, "Dépendance inactive : $dep");
        }
    }
}
