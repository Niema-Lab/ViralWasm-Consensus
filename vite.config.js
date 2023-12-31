import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	return {
		base: env.VITE_OFFLINE_VERSION === "true" ? '/' : '/ViralWasm-Consensus/',
		plugins: [react()],
		build: {
			sourcemap: true,
		}
	}
})
