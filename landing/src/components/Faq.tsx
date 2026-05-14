import { Accordion } from '@base-ui/react/accordion';

interface Props {
  items: { q: string; a: string }[];
}

export function Faq({ items }: Props) {
  return (
    <Accordion.Root className="faq-list">
      {items.map((item, i) => (
        <Accordion.Item key={i} value={i} className="faq-item">
          <Accordion.Header>
            <Accordion.Trigger className="faq-trigger">
              {item.q}
              <span aria-hidden="true" className="faq-marker">+</span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="faq-panel">
            <div className="faq-answer">{item.a}</div>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
