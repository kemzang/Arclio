import {Outlet} from 'react-router-dom'
import {Sidebar} from '@renderer/components/layout/Sidebar.js'
import {TitleBar} from '@renderer/components/layout/TitleBar.js'
import {AppBackdrop} from '@renderer/components/layout/background/AppBackdrop.js'

export function AppLayout(): React.JSX.Element {
	return (
		<div className="h-screen flex flex-col select-none">
			<AppBackdrop />
			<TitleBar />
			<div className="flex flex-1 overflow-hidden">
				<Sidebar />
				<main className="flex-1 overflow-y-auto">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
