import {contextBridge, ipcRenderer} from 'electron'

contextBridge.exposeInMainWorld('arclioApi', {
	downloads: {
		start: (input: {url: string; outputDir: string}) => ipcRenderer.invoke('arclio:downloads:start', input),
		pause: (id: string) => ipcRenderer.invoke('arclio:downloads:pause', id),
		resume: (id: string) => ipcRenderer.invoke('arclio:downloads:resume', id),
		cancel: (id: string) => ipcRenderer.invoke('arclio:downloads:cancel', id)
	},
	queue: {
		addItem: (item: {id: string; url: string; status: string; priority: number}) => ipcRenderer.invoke('arclio:queue:add', item),
		removeItem: (id: string) => ipcRenderer.invoke('arclio:queue:remove', id),
		pauseAll: () => ipcRenderer.invoke('arclio:queue:pauseAll'),
		resumeAll: () => ipcRenderer.invoke('arclio:queue:resumeAll'),
		getItems: () => ipcRenderer.invoke('arclio:queue:getItems')
	},
	library: {scan: (path: string) => ipcRenderer.invoke('arclio:library:scan', path), importMedia: (mediaId: string) => ipcRenderer.invoke('arclio:library:import', mediaId)},
	viewer: {open: (mediaId: string) => ipcRenderer.invoke('arclio:viewer:open', mediaId)},
	converter: {run: (input: {sourcePath: string; outputPath: string; format: string}) => ipcRenderer.invoke('arclio:converter:run', input), runChain: (chain: unknown, file: string) => ipcRenderer.invoke('arclio:converter:runChain', chain, file)},
	sources: {scan: (sourceId: string) => ipcRenderer.invoke('arclio:sources:scan', sourceId)},
	search: {search: (query: {text: string}) => ipcRenderer.invoke('arclio:search:search', query)},
	collections: {create: (input: {name: string; description?: string; itemIds: string[]}) => ipcRenderer.invoke('arclio:collections:create', input)},
	favorites: {add: (mediaId: string) => ipcRenderer.invoke('arclio:favorites:add', mediaId), remove: (mediaId: string) => ipcRenderer.invoke('arclio:favorites:remove', mediaId), isFavorite: (mediaId: string) => ipcRenderer.invoke('arclio:favorites:isFavorite', mediaId)},
	history: {record: (mediaId: string, action: string) => ipcRenderer.invoke('arclio:history:record', mediaId, action), getRecent: (limit?: number) => ipcRenderer.invoke('arclio:history:getRecent', limit)},
	tags: {create: (name: string, color?: string) => ipcRenderer.invoke('arclio:tags:create', name, color), tagItem: (itemId: string, tagId: string) => ipcRenderer.invoke('arclio:tags:tagItem', itemId, tagId), untagItem: (itemId: string, tagId: string) => ipcRenderer.invoke('arclio:tags:untagItem', itemId, tagId)},
	events: {onDownloadCompleted: (cb: (payload: unknown) => void) => ipcRenderer.on('arclio:download:completed', (_e, p) => cb(p)), onDownloadProgress: (cb: (payload: unknown) => void) => ipcRenderer.on('arclio:download:progress', (_e, p) => cb(p))}
})
