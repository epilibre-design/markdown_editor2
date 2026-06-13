<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

require_once dirname(__DIR__, 2) . '/markdown_editor_pipelines.php';

/**
 * Vérifie la structure de la barre d'outils produite par le pipeline
 * markdown_editor_toolbars().
 */
final class ToolbarsTest extends TestCase
{
    /** @return array<int,string> tous les 'component' présents, récursivement */
    private function collecterComponents(array $noeuds): array
    {
        $components = [];
        foreach ($noeuds as $noeud) {
            if (!is_array($noeud)) {
                continue;
            }
            if (isset($noeud['component'])) {
                $components[] = $noeud['component'];
            }
            if (isset($noeud['children'])) {
                $components = array_merge($components, $this->collecterComponents($noeud['children']));
            }
        }
        return $components;
    }

    private function toolbar(): array
    {
        $flux = markdown_editor_toolbars(['data' => []]);
        return $flux['data'];
    }

    public function testRetourneLesDeuxBarres(): void
    {
        $data = $this->toolbar();
        $this->assertArrayHasKey('edition', $data);
        $this->assertArrayHasKey('forum', $data);
    }

    public function testBarreEditionNonVide(): void
    {
        $data = $this->toolbar();
        $this->assertNotEmpty($data['edition']);
    }

    public function testComposantsEssentielsPresents(): void
    {
        $components = $this->collecterComponents($this->toolbar()['edition']);

        foreach ([
            'UndoRedoButton',
            'HeadingDropdownMenu',
            'ListDropdownMenu',
            'MarkButton',
            'LinkPopover',
            'SpipModelButton',
            'EditorModeButton',
            'FullscreenToggleButton',
        ] as $attendu) {
            $this->assertContains($attendu, $components, "Composant manquant : $attendu");
        }
    }

    public function testBoutonsGrasItaliquePresents(): void
    {
        // Récupère les MarkButton et vérifie les types bold/italic/strike/code
        $types = [];
        $parcourir = function ($noeuds) use (&$parcourir, &$types) {
            foreach ($noeuds as $noeud) {
                if (!is_array($noeud)) {
                    continue;
                }
                if (($noeud['component'] ?? '') === 'MarkButton') {
                    $types[] = $noeud['type'];
                }
                if (isset($noeud['children'])) {
                    $parcourir($noeud['children']);
                }
            }
        };
        $parcourir($this->toolbar()['edition']);

        $this->assertContains('bold', $types);
        $this->assertContains('italic', $types);
        $this->assertContains('strike', $types);
        $this->assertContains('code', $types);
    }
}
