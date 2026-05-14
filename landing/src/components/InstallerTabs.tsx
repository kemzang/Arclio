import { Tabs } from '@base-ui/react/tabs';

interface Props {
  ariaLabel: string;
  labelWindows: string;
  labelMac: string;
  labelLinux: string;
}

export function InstallerTabs({ ariaLabel, labelWindows, labelMac, labelLinux }: Props) {
  return (
    <Tabs.Root defaultValue="windows" aria-label={ariaLabel}>
      <Tabs.List className="picker-os-row">
        <Tabs.Tab value="windows" className="btn btn-secondary picker-os-btn" data-track="picker-tab-windows">{labelWindows}</Tabs.Tab>
        <Tabs.Tab value="mac" className="btn btn-secondary picker-os-btn" data-track="picker-tab-mac">{labelMac}</Tabs.Tab>
        <Tabs.Tab value="linux" className="btn btn-secondary picker-os-btn" data-track="picker-tab-linux">{labelLinux}</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="windows" className="picker-assets" id="picker-panel-windows">
        <div id="picker-assets-windows" />
      </Tabs.Panel>
      <Tabs.Panel value="mac" className="picker-assets" id="picker-panel-mac">
        <div id="picker-assets-mac" />
      </Tabs.Panel>
      <Tabs.Panel value="linux" className="picker-assets" id="picker-panel-linux">
        <div id="picker-assets-linux" />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
