import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function resolveBasePath() {
  if (!process.env.GITHUB_ACTIONS) {
    return '/'
  }

  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]
  return repository ? `/${repository}/` : '/'
}

export default defineConfig({
  plugins: [react()],
  base: resolveBasePath(),
})
