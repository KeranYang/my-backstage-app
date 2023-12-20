import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const iksmPlugin = createPlugin({
  id: 'iksm',
  routes: {
    root: rootRouteRef,
  },
});

export const IksmPage = iksmPlugin.provide(
  createRoutableExtension({
    name: 'IksmPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);