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
