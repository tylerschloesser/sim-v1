import { Subscribe } from '@react-rxjs/core'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { ErrorPage } from './error-page.js'
import './index.scss'

const container = document.getElementById('root')
invariant(container)

const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('./world.js').then((m) => ({ Component: m.World })),
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        lazy: () =>
          import('./world.js').then((m) => ({
            Component: m.WorldRoot,
          })),
      },
      {
        path: 'build',
        lazy: () =>
          import('./world.js').then((m) => ({
            Component: m.ConfigureBuild,
          })),
      },
      {
        path: 'build/:entityType',
        lazy: () => import('./world.js').then((m) => ({ Component: m.Build })),
      },
      {
        path: '/select',
        lazy: () => import('./world.js').then((m) => ({ Component: m.Select })),
      },
    ],
  },
])

createRoot(container).render(
  <Subscribe>
    <RouterProvider router={router} />
  </Subscribe>,
)
