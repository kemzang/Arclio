// A virtual "row" for an expanded queue item is really two <tr>s — the item
// row and its QueueArtifactsRow sibling (marked with data-queue-artifacts-row).
// react-virtual's default measureElement only measures the ref'd node, so
// without this the virtualizer's offsets fall out of sync with the real DOM
// the moment any row is expanded, producing a visible jump/overlap on scroll.
export function measureQueueRowElement(element: Element): number {
	let height = element.getBoundingClientRect().height
	const next = element.nextElementSibling
	if (next?.getAttribute('data-queue-artifacts-row') === 'true') {
		height += next.getBoundingClientRect().height
	}
	return height
}
