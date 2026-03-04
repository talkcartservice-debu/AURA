import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '@/lib/utils';
export function ResizablePanelGroup({ className, ...props }) { return <PanelGroup className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)} {...props} />; }
export const ResizablePanel = Panel;
export function ResizableHandle({ className, ...props }) { return <PanelResizeHandle className={cn('relative flex w-px items-center justify-center bg-border', className)} {...props} />; }
