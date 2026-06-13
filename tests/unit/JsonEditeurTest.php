<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once dirname(__DIR__, 2) . '/formulaires/inserer_modeles.php';

/**
 * Génération du JSON décrivant le modèle pour l'éditeur JS :
 * inserer_modeles_generer_json_editeur().
 */
final class JsonEditeurTest extends TestCase
{
    protected function tearDown(): void
    {
        unset($GLOBALS['_test_request']);
    }

    public function testSansModeleRetourneDescriptionVide(): void
    {
        $GLOBALS['_test_request'] = [];
        $json = inserer_modeles_generer_json_editeur([]);
        // $description reste [] -> json "[]"
        $this->assertSame('[]', $json);
    }

    public function testNomEtIdRepris(): void
    {
        $GLOBALS['_test_request'] = ['modele' => 'doc', 'id_modele' => '5'];
        $desc = json_decode(inserer_modeles_generer_json_editeur(['modele', 'id_modele']), true);
        $this->assertSame('doc', $desc['name']);
        $this->assertSame('5', $desc['id']);
    }

    public function testAlignAjouteEnParametreNul(): void
    {
        $GLOBALS['_test_request'] = ['modele' => 'doc', 'align' => 'left'];
        $desc = json_decode(inserer_modeles_generer_json_editeur(['modele', 'align']), true);
        $this->assertArrayHasKey('left', $desc['params']);
        $this->assertNull($desc['params']['left']);
    }

    public function testChampValueAjouteAvecSaValeur(): void
    {
        $GLOBALS['_test_request'] = ['modele' => 'doc', 'largeur' => '200'];
        $desc = json_decode(inserer_modeles_generer_json_editeur(['modele', 'largeur']), true);
        $this->assertSame('200', $desc['params']['largeur']);
    }

    public function testChampTableauConvertiEnListe(): void
    {
        $GLOBALS['_test_request'] = ['modele' => 'doc', 'masquer' => ['legende', 'titre']];
        $desc = json_decode(inserer_modeles_generer_json_editeur(['modele', 'masquer']), true);
        $this->assertSame('legende,titre', $desc['params']['masquer']);
    }
}
