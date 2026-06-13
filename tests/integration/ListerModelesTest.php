<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Découverte des formulaires de modèles depuis les fichiers modeles/*.yaml :
 * inserer_modeles_lister_formulaires_modeles().
 */
final class ListerModelesTest extends TestCase
{
    public function testLeModeleMediaEstDecouvert(): void
    {
        include_spip('inc/inserer_modeles');
        $modeles = inserer_modeles_lister_formulaires_modeles();

        $this->assertArrayHasKey('media', $modeles, 'modeles/media.yaml non découvert');
    }

    public function testStructureDuModele(): void
    {
        include_spip('inc/inserer_modeles');
        $media = inserer_modeles_lister_formulaires_modeles()['media'];

        $this->assertArrayHasKey('nom', $media);
        $this->assertNotSame('', $media['nom']);
        $this->assertArrayHasKey('parametres', $media);
        $this->assertNotEmpty($media['parametres']);
    }
}
