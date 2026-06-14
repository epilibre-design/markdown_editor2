<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Résolution de l'état du formulaire : inserer_modeles_etat_formulaire_modele().
 * '' => état liste (a) ; préfixe non vide => état paramètres (b).
 */
final class EtatModeleTest extends TestCase
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

    public function testPrefixeFourniEnArgument(): void
    {
        $this->assertSame('media', inserer_modeles_etat_formulaire_modele('media', serialize([])));
    }

    public function testAnnulerRameneALaListe(): void
    {
        set_request('annuler', '1');
        $this->assertSame('', inserer_modeles_etat_formulaire_modele('media', serialize([])));
    }

    public function testPrefixeDepuisRequest(): void
    {
        set_request('formulaire_modele', 'media');
        $this->assertSame('media', inserer_modeles_etat_formulaire_modele('', serialize([])));
    }

    public function testRetrouveDepuisEnvModele(): void
    {
        // media.yaml déclare la saisie 'modele' avec defaut 'doc'
        $this->assertSame('media', inserer_modeles_etat_formulaire_modele('', serialize(['modele' => 'doc'])));
    }

    public function testRienNeDonneEtatListe(): void
    {
        $this->assertSame('', inserer_modeles_etat_formulaire_modele('', serialize([])));
    }
}
