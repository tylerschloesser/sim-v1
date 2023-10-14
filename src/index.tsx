import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import invariant from 'tiny-invariant'
import './index.scss'
import { World } from './world.js'

const container = document.getElementById('root')
invariant(container)

const router = createBrowserRouter([
  {
    path: '/',
    element: <World />,
    errorElement: <>TODO handle errors</>,
  },
])

createRoot(container).render(<RouterProvider router={router} />)
