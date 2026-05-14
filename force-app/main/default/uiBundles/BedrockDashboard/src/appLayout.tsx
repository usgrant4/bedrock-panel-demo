import { Outlet, NavLink } from 'react-router';
import { getAllRoutes } from './router-utils';

export default function AppLayout() {
  const navigationRoutes = getAllRoutes()
    .filter(
      route =>
        route.handle?.showInNavigation === true &&
        route.fullPath !== undefined &&
        route.handle?.label !== undefined
    )
    .map(route => ({
      path: route.fullPath,
      label: route.handle?.label as string,
    }));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              Bedrock Build Dashboard
            </div>
            <div className="text-xs text-slate-500">
              Proactive service for connected heavy equipment · TA panel build
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navigationRoutes.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-7xl px-6 py-6 text-xs text-slate-400">
        SForg · Bedrock_* namespace · 7 custom objects · 4 Apex actions · 1 Agentforce agent
      </footer>
    </div>
  );
}
