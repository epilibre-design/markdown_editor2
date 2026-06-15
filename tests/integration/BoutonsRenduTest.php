<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Rendu du mini-squelette des boutons selon l'état.
 */
final class BoutonsRenduTest extends TestCase
{
    public function testEtatListeAfficheChoisir(): void
    {
        $html = recuperer_fond('formulaires/inserer_modeles_boutons', ['formulaire_modele' => '']);
        $this->assertStringContainsString('name="choisir"', $html);
        $this->assertStringNotContainsString('name="inserer"', $html);
    }

    public function testEtatParametresAfficheInsererEtAnnuler(): void
    {
        $html = recuperer_fond('formulaires/inserer_modeles_boutons', ['formulaire_modele' => 'media']);
        $this->assertStringContainsString('name="inserer"', $html);
        $this->assertStringContainsString('name="annuler"', $html);
        $this->assertStringNotContainsString('name="choisir"', $html);
    }

    public function testBoutonAnnulerMasquable(): void
    {
        $html = recuperer_fond('formulaires/inserer_modeles_boutons', [
            'formulaire_modele' => 'media',
            'ne_pas_afficher_bouton_annuler' => 'on',
        ]);
        $this->assertStringContainsString('name="inserer"', $html);
        $this->assertStringNotContainsString('name="annuler"', $html);
    }
}
