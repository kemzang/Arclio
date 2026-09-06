import type {ReactNode} from 'react'
import {useTranslation} from 'react-i18next'
import {Button} from './button.js'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from './dialog.js'

interface ConfirmDialogProps {
	open: boolean
	title: string
	description: string
	confirmLabel?: string
	cancelLabel?: string
	destructive?: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
}

export function ConfirmDialog({open, title, description, confirmLabel, cancelLabel, destructive = true, onOpenChange, onConfirm}: ConfirmDialogProps): ReactNode {
	const {t} = useTranslation()
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						{cancelLabel ?? t('common.cancel')}
					</Button>
					<Button
						variant={destructive ? 'destructive' : 'default'}
						onClick={() => {
							onConfirm()
							onOpenChange(false)
						}}
					>
						{confirmLabel ?? t('common.delete')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
