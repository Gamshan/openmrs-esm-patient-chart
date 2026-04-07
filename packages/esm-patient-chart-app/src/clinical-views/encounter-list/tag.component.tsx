import React from 'react';
import { Tag } from '@carbon/react';
import { getObsFromEncounter, findObs } from '../utils/helpers';
import { type ConfigConcepts, type Encounter } from '../types';

type CarbonTagType =
  | 'red'
  | 'magenta'
  | 'purple'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'gray'
  | 'cool-gray'
  | 'warm-gray'
  | 'high-contrast'
  | 'outline';

const isHexColor = (value: string) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);

const isLightColor = (hex: string) => {
  const color = hex.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
};

export const renderTag = (
  encounter: Encounter,
  concept: string,
  statusColorMappings: Record<string, string>,
  config: ConfigConcepts,
) => {
  const columnStatus = getObsFromEncounter({ encounter, obsConcept: concept, config });
  const columnStatusObs = findObs(encounter, concept);

  if (columnStatus === '--') {
    return '--';
  }

  const uuid =
    typeof columnStatusObs?.value === 'object' && 'uuid' in columnStatusObs.value ? columnStatusObs.value.uuid : null;

  const displayName = typeof columnStatus === 'string' ? columnStatus : '';

  const colorValue = uuid ? statusColorMappings[uuid] : statusColorMappings[displayName];
  const getLightBackground = (hex: string) => {
    const color = hex.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.15)`;
  };
  if (colorValue && isHexColor(colorValue)) {
    const bgColor = getLightBackground(colorValue);
    const textColor = colorValue;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 500,
          backgroundColor: bgColor,
          color: textColor,
          whiteSpace: 'nowrap',
        }}
      >
        {displayName}
      </span>
    );
  }

  return <Tag type={(colorValue as CarbonTagType) ?? 'gray'}>{displayName}</Tag>;
};
