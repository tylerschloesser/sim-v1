import { Subscribe } from '@react-rxjs/core'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import invariant from 'tiny-invariant'
import { Build } from './build.js'
import { ConfigureBuild } from './configure-build.js'
import { ErrorPage } from './error-page.js'
import './index.scss'
import { Select } from './select.js'
import { WorldRoot } from './world-root.js'
import { World } from './world.js'

const container = document.getElementById('root')
invariant(container)

const router = createBrowserRouter([
  {
    path: '/',
    element: <World />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <WorldRoot />,
      },
      {
        path: 'build',
        element: <ConfigureBuild />,
      },
      {
        path: 'build/:entityType',
        element: <Build />,
      },
      {
        path: '/select',
        element: <Select />,
      },
    ],
  },
])

createRoot(container).render(
  <Subscribe>
    <RouterProvider router={router} />
  </Subscribe>,
)
