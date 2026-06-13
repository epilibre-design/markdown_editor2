<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once dirname(__DIR__, 2) . '/inc/inserer_modeles.php';

/**
 * Application des valeurs par défaut aux saisies d'un modèle :
 * inserer_modeles_definir_defaut().
 */
final class DefinirDefautTest extends TestCase
{
    public function testDefautLitteralInchange(): void
    {
        $saisies = [
            ['saisie' => 'hidden', 'options' => ['nom' => 'modele', 'defaut' => 'doc']],
        ];
        $this->assertSame($saisies, inserer_modeles_definir_defaut($saisies));
    }

    public function testDefautFonctionEvalue(): void
    {
        $saisies = [
            ['saisie' => 'input', 'options' => ['nom' => 'x', 'defaut' => 'fonction:strtoupper("ab")']],
        ];
        $resultat = inserer_modeles_definir_defaut($saisies);
        $this->assertSame('AB', $resultat[0]['options']['defaut']);
    }

    /**
     * Une entrée non-tableau dans la liste des saisies doit être ignorée,
     * sans faire perdre les saisies valides ni retourner null.
     * (Régression de l'ancien `return $tableau;` sur variable indéfinie.)
     */
    public function testEntreeNonTableauNeCassePasLaFonction(): void
    {
        $saisies = [
            ['saisie' => 'input', 'options' => ['nom' => 'x', 'defaut' => 'doc']],
            'parasite', // entrée mal formée
        ];
        $resultat = inserer_modeles_definir_defaut($saisies);

        $this->assertIsArray($resultat, 'La fonction ne devrait pas retourner null');
        $this->assertArrayHasKey(0, $resultat, 'La saisie valide ne doit pas être perdue');
        $this->assertSame('doc', $resultat[0]['options']['defaut']);
    }

    public function testSaisiesImbriqueesParcouruesRecursivement(): void
    {
        $saisies = [
            [
                'saisie' => 'fieldset',
                'options' => ['nom' => 'grp'],
                'saisies' => [
                    ['saisie' => 'input', 'options' => ['nom' => 'y', 'defaut' => 'fonction:strtoupper("cd")']],
                ],
            ],
        ];
        $resultat = inserer_modeles_definir_defaut($saisies);
        $this->assertSame('CD', $resultat[0]['saisies'][0]['options']['defaut']);
    }
}
