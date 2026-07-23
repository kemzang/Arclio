import type {Plugin} from './Plugin'

export class PluginManager {
	#plugins = new Map<string, Plugin>()

	async register(plugin: Plugin): Promise<void> {
		this.#plugins.set(plugin.id, plugin)
		await plugin.activate()
	}

	async unregister(pluginId: string): Promise<void> {
		const plugin = this.#plugins.get(pluginId)
		if (plugin) {
			await plugin.deactivate()
			this.#plugins.delete(pluginId)
		}
	}

	list(): Plugin[] {
		return Array.from(this.#plugins.values())
	}

	get(pluginId: string): Plugin | undefined {
		return this.#plugins.get(pluginId)
	}
}
