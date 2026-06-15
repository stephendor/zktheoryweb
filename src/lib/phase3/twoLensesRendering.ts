import type { Phase3Export, SiteReference } from './contracts';

export interface RenderableTwoLensesLink {
  id: string;
  title: string;
  href: string;
  mathematical: Pick<SiteReference, 'label' | 'title'>;
  political: Pick<SiteReference, 'label' | 'title'>;
  rationale: string;
  concepts: string[];
}

export function confirmedTwoLensesLinks(
  data: Phase3Export,
): RenderableTwoLensesLink[] {
  return data.twoLenses
    .filter((link) => link.status === 'confirmed')
    .map((link) => ({
      id: link.id,
      title: link.title,
      href: link.websitePath,
      mathematical: {
        label: link.mathematical.label,
        title: link.mathematical.title,
      },
      political: {
        label: link.political.label,
        title: link.political.title,
      },
      rationale: link.rationale,
      concepts: link.concepts,
    }));
}
