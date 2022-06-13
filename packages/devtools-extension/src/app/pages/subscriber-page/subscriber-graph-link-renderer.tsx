import React, { useEffect, useMemo, useRef } from 'react';
import {
  DefaultLinkControl,
  LinkControl,
  LinkRendererProps,
} from '@app/components/graph';
import { RelatedHierarchyNode } from '@app/protocols/insights';
import { useTheme } from '@mui/material';
import { useSelector } from '@app/store';
import { timeSelector } from '@app/selectors/insights-selectors';
import {
  getDirection,
  getEventColors,
  getTargetColors,
} from '@app/pages/subscriber-page/subscriber-graph-utils';
import gsap from 'gsap';
import { createSelector } from '@lib/store';
import { activeSubscriberStateSelector } from '@app/selectors/active-target-state-selector';

const vmSelector = (targetId: number) =>
  createSelector(
    [activeSubscriberStateSelector, timeSelector],
    ([activeSubscriberState, time]) => {
      const { relations } = activeSubscriberState!;
      const event = relations.events[time];
      const target = relations.targets[targetId];
      const isSelected = event && event.target === target.id;

      return {
        event,
        target,
        isSelected,
      };
    }
  );

export const SubscriberGraphLinkRenderer = React.forwardRef<
  LinkControl,
  LinkRendererProps<RelatedHierarchyNode>
>(function LinkRenderer({ link }, forwardedRef) {
  const theme = useTheme();
  const vmSelectorMemo = useMemo(
    () => vmSelector(link.source.data.target),
    [link.source.data.target]
  );
  const vm = useSelector(vmSelectorMemo);

  const elementRef = useRef<SVGPathElement | null>(null);
  React.useImperativeHandle(
    forwardedRef,
    () => new DefaultLinkControl(elementRef, 6),
    []
  );

  const targetColors = getTargetColors(theme, vm.target);
  const eventColors = getEventColors(theme, vm.event);

  const tweenRef = useRef<gsap.core.Tween | null>(null);
  useEffect(() => {
    tweenRef.current?.kill();
    if (vm.isSelected) {
      const direction = getDirection(vm.event.eventType);
      tweenRef.current = gsap.fromTo(
        elementRef.current!,
        { strokeDasharray: 4, strokeDashoffset: 32 * direction },
        {
          strokeDashoffset: 0,
          duration: 1,
          repeat: -1,
          ease: 'none',
        }
      );
    } else {
      gsap.set(elementRef.current!, {
        strokeDasharray: 'none',
        strokeDashoffset: 0,
      });
    }
  }, [vm.isSelected && vm.event.eventType]);

  return (
    <path
      ref={elementRef}
      stroke={vm.isSelected ? eventColors.secondary : targetColors.secondary}
      fill="transparent"
    />
  );
});