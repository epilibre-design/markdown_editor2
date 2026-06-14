<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Contexte produit par charger() après refonte.
 */
final class ChargerEtatTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        include_spip('formulaires/inserer_modeles');
    }

    private function reset(): void
    {
        foreach (['annuler', 'formulaire_modele'] as $k) {
            set_request($k, null);
        }
    }

    protected function setUp(): void { $this->reset(); }
    protected function tearDown(): void { $this->reset(); }

    public function testEtatParametres(): void
    {
        $ctx = formulaires_inserer_modeles_charger_dist('media', '', serialize([]));
        $this->assertSame('media', $ctx['formulaire_modele']);
        $this->assertNotEmpty($ctx['_nom']);
        // modèle imposé en argument => bouton annuler masqué
        $this->assertSame('on', $ctx['ne_pas_afficher_bouton_annuler']);
    }

    public function testEtatListeNeFixePasDeModele(): void
    {
        $ctx = formulaires_inserer_modeles_charger_dist('', '', serialize([]));
        $this->assertArrayNotHasKey('formulaire_modele', $ctx);
    }

    public function testModalboxNormalise(): void
    {
        $ctx = formulaires_inserer_modeles_charger_dist('media', 'oui', serialize([]));
        $this->assertSame('oui', $ctx['modalbox']);
    }
}
