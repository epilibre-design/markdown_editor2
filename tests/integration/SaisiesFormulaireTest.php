<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Structure des saisies déclarées par formulaires_inserer_modeles_saisies_dist().
 */
final class SaisiesFormulaireTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        include_spip('formulaires/inserer_modeles');
    }

    private function reset(): void
    {
        foreach (['annuler', 'formulaire_modele', '_code_modele', '_json_editeur', '_js_inserer_code'] as $k) {
            set_request($k, null);
        }
    }

    protected function setUp(): void { $this->reset(); }
    protected function tearDown(): void { $this->reset(); }

    public function testOptionsCommunes(): void
    {
        $saisies = formulaires_inserer_modeles_saisies_dist('', '', serialize([]));
        $this->assertTrue($saisies['options']['ajax']);
        $this->assertSame('formulaires/inserer_modeles_boutons', $saisies['options']['squelette_boutons']);
    }

    public function testEtatListeContientLaSaisieRadio(): void
    {
        $saisies = formulaires_inserer_modeles_saisies_dist('', '', serialize([]));
        // 1er élément non-'options' = la saisie radio de la liste des modèles
        $this->assertSame('radio', $saisies[0]['saisie']);
        $this->assertSame('formulaire_modele', $saisies[0]['options']['nom']);
    }

    public function testEtatParametresContientHiddenEtParametres(): void
    {
        $saisies = formulaires_inserer_modeles_saisies_dist('media', '', serialize([]));
        // 1er champ = hidden formulaire_modele
        $this->assertSame('hidden', $saisies[0]['saisie']);
        $this->assertSame('formulaire_modele', $saisies[0]['options']['nom']);
        $this->assertSame('media', $saisies[0]['options']['defaut']);
        // les paramètres du yaml suivent : on retrouve le champ 'modele' (defaut 'doc')
        $noms = [];
        foreach ($saisies as $cle => $saisie) {
            if ($cle === 'options' || !isset($saisie['options']['nom'])) {
                continue;
            }
            $noms[] = $saisie['options']['nom'];
        }
        $this->assertContains('id_modele', $noms);
        $this->assertContains('align', $noms);
    }

    public function testEtatParametresRenseigneInsererDebut(): void
    {
        // La textarea résultat ne s'affiche que lorsqu'un code a été produit
        // par traiter() (iso-comportement de l'ancien squelette, ligne 15).
        set_request('_code_modele', '<doc5|left>');
        $saisies = formulaires_inserer_modeles_saisies_dist('media', '', serialize([]));
        $this->assertStringContainsString('class="code_modele"', $saisies['options']['inserer_debut']);
    }
}
