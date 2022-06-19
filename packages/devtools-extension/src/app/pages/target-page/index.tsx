import React from 'react';
import { Box } from '@mui/material';
import { SidePanel, SidePanelSection } from '@app/components';
import { EventsPanel } from '@app/pages/target-page/events-panel';
import { SubscribersGraph } from '@app/pages/target-page/subscribers-graph';
import { ContextPanel } from '@app/pages/target-page/context-panel';

export function TargetPage() {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
      }}
    >
      <SidePanel>
        <SidePanelSection title="CONTEXT" basis={1}>
          <ContextPanel />
        </SidePanelSection>
        <SidePanelSection title="EVENTS" basis={2}>
          <EventsPanel />
        </SidePanelSection>
      </SidePanel>
      <Box sx={{ flexGrow: 1, flexShrink: 1 }}>
        <SubscribersGraph />
      </Box>
    </Box>
  );
}