/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex --
   The pan/zoom surface below is a custom canvas-like widget. No ARIA role
   describes "draggable, zoomable image viewport", and labelling it a button
   would misreport it to assistive tech. It is instead made focusable and fully
   keyboard-operable (arrows pan, +/- zoom, 0 resets), which is what these rules
   exist to guarantee. */
import {useState, useCallback, useRef} from 'react'
import {ZoomIn, ZoomOut, Maximize2, RotateCw} from 'lucide-react'
import {Button} from '@renderer/components/ui/button.js'

interface ImageViewerProps {
	fileUrl: string
	title: string
}

export function ImageViewer({fileUrl, title}: ImageViewerProps): React.JSX.Element {
	const [scale, setScale] = useState(1)
	const [rotation, setRotation] = useState(0)
	const [isDragging, setIsDragging] = useState(false)
	const [position, setPosition] = useState({x: 0, y: 0})
	const dragStart = useRef({x: 0, y: 0})

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			setIsDragging(true)
			dragStart.current = {x: e.clientX - position.x, y: e.clientY - position.y}
		},
		[position]
	)

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!isDragging) return
			setPosition({x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y})
		},
		[isDragging]
	)

	const handleMouseUp = useCallback(() => {
		setIsDragging(false)
	}, [])

	const handleWheel = useCallback((e: React.WheelEvent) => {
		e.preventDefault()
		const delta = e.deltaY > 0 ? -0.1 : 0.1
		setScale(s => Math.max(0.1, Math.min(5, s + delta)))
	}, [])

	// Keyboard equivalents for the pointer gestures, so panning and zooming are
	// reachable without a mouse.
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		const step = e.shiftKey ? 50 : 15
		switch (e.key) {
			case 'ArrowLeft':
				setPosition(p => ({...p, x: p.x + step}))
				break
			case 'ArrowRight':
				setPosition(p => ({...p, x: p.x - step}))
				break
			case 'ArrowUp':
				setPosition(p => ({...p, y: p.y + step}))
				break
			case 'ArrowDown':
				setPosition(p => ({...p, y: p.y - step}))
				break
			case '+':
			case '=':
				setScale(s => Math.min(5, s + 0.1))
				break
			case '-':
				setScale(s => Math.max(0.1, s - 0.1))
				break
			case '0':
				setScale(1)
				setPosition({x: 0, y: 0})
				break
			default:
				return
		}
		e.preventDefault()
	}, [])

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" disabled={scale <= 0.1} onClick={() => setScale(s => Math.max(0.1, s - 0.2))}>
						<ZoomOut className="size-4" />
					</Button>
					<span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
					<Button variant="ghost" size="sm" disabled={scale >= 5} onClick={() => setScale(s => Math.min(5, s + 0.2))}>
						<ZoomIn className="size-4" />
					</Button>
					<Button variant="ghost" size="sm" onClick={() => setScale(1)}>
						Reset
					</Button>
				</div>
				<h2 className="text-sm font-medium truncate max-w-md">{title}</h2>
				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" onClick={() => setRotation(r => (r + 90) % 360)}>
						<RotateCw className="size-4" />
					</Button>
					<Button variant="ghost" size="sm">
						<Maximize2 className="size-4" />
					</Button>
				</div>
			</div>
			{/* Custom pan/zoom surface: drag to move, wheel to scale. `application`
			    tells assistive tech the region handles its own pointer gestures. */}
			<div
				role="application"
				aria-label={title}
				tabIndex={0}
				className="flex-1 overflow-hidden flex items-center justify-center bg-[var(--bg-primary)] cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseUp}
				onWheel={handleWheel}
				onKeyDown={handleKeyDown}
			>
				<img src={fileUrl} alt={title} className="max-h-full max-w-full object-contain select-none" style={{transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`, transition: isDragging ? 'none' : 'transform 0.1s ease-out'}} draggable={false} />
			</div>
		</div>
	)
}
