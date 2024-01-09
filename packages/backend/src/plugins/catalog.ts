import { CatalogBuilder } from '@backstage/plugin-catalog-backend';
import { ScaffolderEntitiesProcessor } from '@backstage/plugin-catalog-backend-module-scaffolder-entity-model';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

import {KubernetesResourcesProvider} from "@internal/plugin-iksm/src/components/EntityProvider/KubernetesResourcesProvider";

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const builder = await CatalogBuilder.create(env);
  const iksm = new KubernetesResourcesProvider('dev', env.reader);
  builder.addEntityProvider(iksm);
  builder.addProcessor(new ScaffolderEntitiesProcessor());
  const { processingEngine, router } = await builder.build();
  await processingEngine.start();

  await env.scheduler.scheduleTask({
    id: 'run_iksm_refresh',
    fn: async()  => {
      await iksm.run();
    },
    frequency: {seconds:5},
    timeout: {minutes: 1}
  });
  return router;
}
