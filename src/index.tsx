import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import invariant from 'tiny-invariant'
import './index.scss'
import { World } from './world.js'
import { WorldRoot } from './world-root.js'
import { Build } from './build.js'

const container = document.getElementById('root')
invariant(container)

const router = createBrowserRouter([
  {
    path: '/',
    element: <World />,
    errorElement: <>TODO handle errors</>,
    children: [
      {
        path: '/',
        element: <WorldRoot />,
      },
      {
        path: 'build/:entityType',
        element: <Build />,
      },
    ],
  },
])

createRoot(container).render(<RouterProvider router={router} />)
