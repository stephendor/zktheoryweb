import type { DerivedConnection, SiteReference } from './contracts';

type Palette = 'tda' | 'cl';

export interface HandAuthoredConnection {
  targetKind: SiteReference['kind'];
  targetId: string;
  href?: string;
  label: string;
  title: string;
  palette: Palette;
}

export interface RenderableConnection {
  href?: string;
  label: string;
  title: string;
  palette: Palette;
  source: 'hand-authored' | 'generated';
  dataTodo?: string;
}

const keyFor = (kind: SiteReference['kind'], id: string): string => `${kind}:${id}`;

const paletteForReference = (reference: SiteReference): Palette =>
  reference.kind === 'chapter' || reference.kind === 'interlude' ? 'cl' : 'tda';

const hrefForReference = (reference: SiteReference): string | undefined => {
  if (reference.href) {
    return reference.href;
  }

  switch (reference.kind) {
    case 'chapter':
      return `/counting-lives/chapters/${reference.id}/`;
    case 'paper':
      return `/tda/papers/${reference.id}/`;
    case 'method':
      return `/tda/methods/${reference.id}/`;
    case 'interlude':
      return `/counting-lives/interludes/${reference.id}/`;
    case 'learn-module':
      return reference.slug ? `/learn/${reference.slug}/` : undefined;
    case 'interactive':
      return `/learn/interactives/${reference.id}/`;
    case 'writing-note':
      return `/writing/notes/${reference.id}/`;
    case 'writing-essay':
      return `/writing/essays/${reference.id}/`;
    case 'external':
      return reference.href;
  }
};

const handAuthoredToRenderable = (
  connection: HandAuthoredConnection,
): RenderableConnection => {
  const renderable: RenderableConnection = {
    label: connection.label,
    title: connection.title,
    palette: connection.palette,
    source: 'hand-authored',
  };

  if (connection.href) {
    renderable.href = connection.href;
  }

  return renderable;
};

const generatedToRenderable = (
  connection: DerivedConnection,
): RenderableConnection => {
  const { target } = connection;
  const href = hrefForReference(target);
  const renderable: RenderableConnection = {
    label: target.label,
    title: target.title,
    palette: paletteForReference(target),
    source: 'generated',
  };

  if (href) {
    renderable.href = href;
  }

  if (target.status === 'pending') {
    renderable.dataTodo = 'pending-route';
  }

  return renderable;
};

export const mergeDerivedConnections = (
  handAuthoredConnections: HandAuthoredConnection[],
  generatedConnections: DerivedConnection[],
): RenderableConnection[] => {
  const handAuthoredKeys = new Set(
    handAuthoredConnections.map((connection) =>
      keyFor(connection.targetKind, connection.targetId),
    ),
  );

  const renderableHandAuthored = handAuthoredConnections.map(handAuthoredToRenderable);
  const renderableGenerated = generatedConnections
    .filter((connection) => connection.confidence !== 'proposed')
    .filter(
      (connection) =>
        !handAuthoredKeys.has(keyFor(connection.target.kind, connection.target.id)),
    )
    .map(generatedToRenderable);

  return [...renderableHandAuthored, ...renderableGenerated];
};
