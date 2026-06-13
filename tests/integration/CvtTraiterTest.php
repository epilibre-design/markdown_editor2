<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Génération du code modèle par le traitement du CVT inserer_modeles :
 * formulaires_inserer_modeles_traiter_dist() doit produire le raccourci
 * <doc...|param=valeur> attendu et le stocker dans _code_modele.
 */
final class CvtTraiterTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        include_spip('formulaires/inserer_modeles');
    }

    private function reset(): void
    {
        foreach (['inserer', 'formulaire_modele', 'modele', 'id_modele', 'variante',
                  'classe', 'align', 'largeur', '_code_modele', '_json_editeur',
                  '_js_inserer_code'] as $k) {
            set_request($k, null);
        }
    }

    protected function setUp(): void
    {
        $this->reset();
    }

    protected function tearDown(): void
    {
        $this->reset();
    }

    public function testCodeModeleAvecIdEtAlign(): void
    {
        set_request('inserer', '1');
        set_request('formulaire_modele', 'media');
        set_request('modele', 'doc');
        set_request('id_modele', '5');
        set_request('align', 'left');

        $retour = formulaires_inserer_modeles_traiter_dist('media', '', serialize([]));

        $this->assertSame('<doc5|left>', _request('_code_modele'));
        $this->assertArrayHasKey('message_ok', $retour);
    }

    public function testCodeModeleAvecParametre(): void
    {
        set_request('inserer', '1');
        set_request('formulaire_modele', 'media');
        set_request('modele', 'doc');
        set_request('id_modele', '7');
        set_request('largeur', '200');

        formulaires_inserer_modeles_traiter_dist('media', '', serialize([]));

        $this->assertSame('<doc7|largeur=200>', _request('_code_modele'));
    }

    public function testSansIdNiParametreAjouteBarreVerticale(): void
    {
        // si aucun numéro ni paramètre, un | est ajouté pour que le modèle soit pris en compte
        set_request('inserer', '1');
        set_request('formulaire_modele', 'media');
        set_request('modele', 'doc');

        formulaires_inserer_modeles_traiter_dist('media', '', serialize([]));

        $this->assertSame('<doc|>', _request('_code_modele'));
    }
}
