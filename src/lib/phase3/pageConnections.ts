import type { DerivedConnection, Phase3Export, SiteReference } from './contracts';
import {
  mergeDerivedConnections,
  type HandAuthoredConnection,
  type RenderableConnection,
} from './mergeDerivedConnections';

export interface PageSourceReference {
  kind: SiteReference['kind'];
  id: string;
}

export interface DerivedConnectionGroup {
  subheading: string;
  connections: RenderableConnection[];
}

export interface RenderableDerivedConnectionGroupOptions {
  handAuthored?: HandAuthoredConnection[];
  subheading?: string;
}

export const derivedConnectionsSubheading = 'Derived from Phase 3';

export function derivedConnectionsForSource(
  data: Phase3Export,
  source: PageSourceReference,
): DerivedConnection[] {
  return data.derivedConnections.filter(
    (connection) =>
      connection.source.kind === source.kind &&
      connection.source.id === source.id &&
      connection.confidence !== 'proposed',
  );
}

export function renderHandAuthoredConnections(
  handAuthored: HandAuthoredConnection[],
): RenderableConnection[] {
  return mergeDerivedConnections(handAuthored, []).filter(
    (connection) => connection.source === 'hand-authored',
  );
}

export function renderableDerivedConnectionGroup(
  generatedConnections: DerivedConnection[],
  options: RenderableDerivedConnectionGroupOptions = {},
): DerivedConnectionGroup | null {
  const merged = mergeDerivedConnections(
    options.handAuthored ?? [],
    generatedConnections,
  );
  const generated = merged.filter((connection) => connection.source === 'generated');

  if (generated.length === 0) {
    return null;
  }

  return {
    subheading: options.subheading ?? derivedConnectionsSubheading,
    connections: generated,
  };
}

export function appendDerivedConnectionGroup(
  groups: DerivedConnectionGroup[],
  group: DerivedConnectionGroup | null,
): DerivedConnectionGroup[] {
  return group ? [...groups, group] : groups;
}
