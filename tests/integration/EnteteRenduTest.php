<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Rendu du mini-squelette d'entête selon l'état.
 */
final class EnteteRenduTest extends TestCase
{
    public function testEtatListeAfficheTitreSansTextarea(): void
    {
        $html = recuperer_fond('formulaires/inserer_modeles_entete', ['formulaire_modele' => '']);
        $this->assertStringContainsString('<h3', $html);
        $this->assertStringNotContainsString('class="code_modele"', $html);
    }

    public function testEtatParametresAfficheTextarea(): void
    {
        $html = recuperer_fond('formulaires/inserer_modeles_entete', [
            'formulaire_modele' => 'media',
            '_nom' => 'Document',
            '_code_modele' => '<doc5|left>',
        ]);
        $this->assertStringContainsString('class="code_modele"', $html);
        $this->assertStringContainsString('&lt;doc5|left&gt;', $html);
    }
}
