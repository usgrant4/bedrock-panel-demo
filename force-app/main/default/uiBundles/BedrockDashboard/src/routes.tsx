import type { RouteObject } from 'react-router';
import AppLayout from '@/appLayout';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import Asset360 from './pages/Asset360';
import Triage from './pages/Triage';
import Architecture from './pages/Architecture';
import NotFound from './pages/NotFound';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
        handle: { showInNavigation: true, label: 'Home' },
      },
      {
        path: 'inventory',
        element: <Inventory />,
        handle: { showInNavigation: true, label: 'Inventory' },
      },
      {
        path: 'asset-360',
        element: <Asset360 />,
        handle: { showInNavigation: true, label: 'Asset 360' },
      },
      {
        path: 'triage',
        element: <Triage />,
        handle: { showInNavigation: true, label: 'Triage' },
      },
      {
        path: 'architecture',
        element: <Architecture />,
        handle: { showInNavigation: true, label: 'Architecture' },
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
