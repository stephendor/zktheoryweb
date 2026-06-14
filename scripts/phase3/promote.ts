import { defaultCandidatePath, defaultPromotedPath, parsePhase3Args, stringOption } from './cli';
import { promotePhase3Candidate } from '../../src/lib/phase3/exporter/promotion';
import { buildSiteRouteRegistryFromWorkspace } from '../../src/lib/phase3/siteRouteRegistry';

const args = parsePhase3Args(process.argv.slice(2));
const candidatePath = stringOption(args, 'candidate', defaultCandidatePath);
const promotedPath = stringOption(args, 'out', defaultPromotedPath);

const promoted = promotePhase3Candidate({
  candidatePath,
  destinationPath: promotedPath,
  registry: buildSiteRouteRegistryFromWorkspace(process.cwd()),
});

console.log(
  `Phase 3 promotion: ${promoted.twoLenses.length} two-lenses, ${promoted.derivedConnections.length} derived connections -> ${promotedPath}`
);
