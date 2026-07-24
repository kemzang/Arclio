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
			<div className="flex-1 overflow-hidden flex items-center justify-center bg-[var(--bg-primary)] cursor-grab active:cursor-grabbing" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
				<img src={fileUrl} alt={title} className="max-h-full max-w-full object-contain select-none" style={{transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`, transition: isDragging ? 'none' : 'transform 0.1s ease-out'}} draggable={false} />
			</div>
		</div>
	)
}
