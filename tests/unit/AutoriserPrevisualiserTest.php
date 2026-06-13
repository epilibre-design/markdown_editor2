<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once dirname(__DIR__, 2) . '/markdown_editor_pipelines.php';

/**
 * Logique d'autorisation de prévisualisation d'un modèle :
 * autoriser_markdowneditormodele_previsualiser_dist().
 *
 * - dans l'espace privé : délègue à autoriser('ecrire')
 * - dans le public : admins complets uniquement (0minirezo non restreints)
 */
final class AutoriserPrevisualiserTest extends TestCase
{
    protected function tearDown(): void
    {
        unset($GLOBALS['_test_espace_prive'], $GLOBALS['_test_autoriser']);
    }

    private function autoriser(array $qui): bool
    {
        return autoriser_markdowneditormodele_previsualiser_dist(
            'previsualiser', 'markdowneditormodele', 0, $qui, []
        );
    }

    public function testPriveDelegueAEcrireAutorise(): void
    {
        $GLOBALS['_test_espace_prive'] = true;
        $GLOBALS['_test_autoriser'] = true;
        $this->assertTrue($this->autoriser(['statut' => '6forum', 'restreint' => false]));
    }

    public function testPriveDelegueAEcriteRefuse(): void
    {
        $GLOBALS['_test_espace_prive'] = true;
        $GLOBALS['_test_autoriser'] = false;
        $this->assertFalse($this->autoriser(['statut' => '0minirezo', 'restreint' => false]));
    }

    public function testPublicAdminComplet(): void
    {
        $GLOBALS['_test_espace_prive'] = false;
        $this->assertTrue($this->autoriser(['statut' => '0minirezo', 'restreint' => false]));
    }

    public function testPublicAdminRestreintRefuse(): void
    {
        $GLOBALS['_test_espace_prive'] = false;
        $this->assertFalse($this->autoriser(['statut' => '0minirezo', 'restreint' => true]));
    }

    public function testPublicRedacteurRefuse(): void
    {
        $GLOBALS['_test_espace_prive'] = false;
        $this->assertFalse($this->autoriser(['statut' => '1comite', 'restreint' => false]));
    }
}
