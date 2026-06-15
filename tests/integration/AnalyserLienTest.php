<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Sécurisation de l'action analyser_lien : validation entrée + cache fichier.
 */
final class AnalyserLienTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        include_spip('inc/texte');
        include_spip('inc/flock');
        include_spip('action/markdown_editor_analyser_lien');
    }

    protected function setUp(): void
    {
        set_request('url', null);
        foreach (glob(_DIR_CACHE . 'markdown_editor/analyser_lien_*') ?: [] as $f) {
            unlink($f);
        }
    }

    protected function tearDown(): void
    {
        set_request('url', null);
    }

    private function appeler(string $url): array
    {
        set_request('url', $url);
        ob_start();
        action_markdown_editor_analyser_lien_dist();
        return json_decode(ob_get_clean(), true);
    }

    public function testUrlVideRetourneReponseParDefaut(): void
    {
        $r = $this->appeler('');
        $this->assertSame('', $r['url']);
        $this->assertSame('', $r['titre']);
    }

    public function testUrlTropLongueRetourneUrlInchangee(): void
    {
        $url = str_repeat('a', 513);
        $r = $this->appeler($url);
        $this->assertSame($url, $r['url']);
    }

    public function testUrlExterneRetourneUrlInchangee(): void
    {
        $r = $this->appeler('https://example.com/page');
        $this->assertSame('https://example.com/page', $r['url']);
    }

    public function testResultatMisEnCacheApresPremiereRequete(): void
    {
        $url = 'https://example.com/cache-test';
        $this->appeler($url);
        $cache_file = _DIR_CACHE . 'markdown_editor/analyser_lien_' . substr(md5($url), 0, 16);
        $this->assertFileExists($cache_file);
    }

    public function testDeuxiemeAppelRetourneMemeResultat(): void
    {
        $url = 'https://example.com/page';
        $r1 = $this->appeler($url);
        $r2 = $this->appeler($url);
        $this->assertSame($r1, $r2);
    }
}
