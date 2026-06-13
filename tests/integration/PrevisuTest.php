<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Traitement de prévisualisation d'un champ : markdown_editor_traitements_previsu().
 * Vérifie l'application des raccourcis SPIP et la sécurisation safehtml().
 */
final class PrevisuTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        include_spip('markdown_editor_fonctions');
    }

    public function testTexteSpipMisEnGras(): void
    {
        $html = markdown_editor_traitements_previsu('{{gras}}');
        $this->assertStringContainsString('<strong>gras</strong>', $html);
    }

    public function testScriptNeutralise(): void
    {
        // safehtml() doit empêcher l'injection de <script>
        $html = markdown_editor_traitements_previsu('<script>alert(1)</script> bonjour');
        $this->assertStringNotContainsString('<script', strtolower($html));
        $this->assertStringContainsString('bonjour', $html);
    }
}
