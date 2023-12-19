import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { iksmPlugin, IksmPage } from '../src/plugin';

createDevApp()
  .registerPlugin(iksmPlugin)
  .addPage({
    element: <IksmPage />,
    title: 'Root Page',
    path: '/iksm'
  })
  .render();
