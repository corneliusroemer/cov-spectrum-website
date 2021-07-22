import React, { useState, useMemo } from 'react';
import { scaleQuantile } from 'd3-scale';
import styled from 'styled-components';
import switzerland from './switzerland.json';
import germany from './germany.json';
import usa from './usa.json';
import { ChartAndMetrics, colors } from '../charts/Metrics';
import { Place } from '../services/api-types';

export interface VectorMapLayer {
  /** Unique ID of each layer. */
  id: string;
  /** Name of the layer. */
  name: string;
  /** SVG path for the layer. */
  d: string;
}

export interface VectorMapProps {
  /** Unique ID of the SVG element. */
  id: string;
  /** Name of the map. */
  name: string;
  /** View box for the map. */
  viewBox: string;
  /** Layers that represent the regions of the map. */
  layers: VectorMapLayer[];
  /** Tab index for each layer. Set to '-1' to disable layer focusing. */
  tabIndex?: number;
  /** Props to spread onto each layer. */
  layerProps?: any;
  /** Layer IDs to 'select' with the 'aria-checked' attribute. */
  checkedLayers?: string[];
  /** Layer IDs to 'select' with the 'aria-current' attribute. */
  currentLayers?: string[];
}

const VectorMap: React.FC<VectorMapProps> = ({
  id,
  name,
  layers,
  tabIndex = 0,
  layerProps,
  checkedLayers,
  currentLayers,
  children,
  ...other
}) => {
  if (!layers || layers.length === 0) {
    // eslint-disable-next-line no-console
    console.error(
      `[react-vector-maps] No 'layers' prop provided. Did you spread a map object onto the component?`
    );
    return null;
  }

  return (
    <svg xmlns='http://www.w3.org/2000/svg' key={id} aria-label={name} {...other}>
      {children}
      {layers.map(layer => (
        <path
          key={layer.id}
          tabIndex={tabIndex}
          aria-label={layer.name}
          aria-checked={checkedLayers && checkedLayers.includes(layer.id)}
          aria-current={currentLayers && currentLayers.includes(layer.id)}
          {...layer}
          {...layerProps}
        />
      ))}
    </svg>
  );
};

type Data = {
  division: string | null;
  count: number;
  prevalence?: number | undefined;
};

interface WrapperProps {
  data: Data[];
  focusDivision: string | null;
}

const colorScale = scaleQuantile<string>()
  .domain([0, 1])
  .range(['#ffedea', '#ffcec5', '#ffad9f', '#ff8a75', '#ff5533', '#e2492d', '#be3d26', '#9a311f', '#782618']);

const Wrapper = styled.div`
  svg {
    path {
      cursor: pointer;
      outline: none;
      stroke: black;
      fill: white;
      ${(p: WrapperProps) =>
        p.data.map(d => {
          return `&[name="${d.division}"] {
        fill: ${
          p.focusDivision !== null && p.focusDivision === d.division
            ? colors.active
            : colorScale(d.prevalence || 0)
        };
      }`;
        })}
    }
  }
`;

type Target = {
  attributes: {
    name: {
      value: string;
    };
  };
};

interface MouseProps {
  target: Target;
}

interface Props {
  data: Data[];
  country: Place;
}

const Map = ({ data, country }: Props) => {
  const [focusData, setFocusData] = useState<Data | undefined>(undefined);

  const layerProps = {
    onMouseEnter: ({ target }: MouseProps) => {
      const newData = data.find(d => d.division === target.attributes.name.value);
      newData && setFocusData(newData);
    },
    onMouseLeave: () => setFocusData(undefined),
  };

  const minPrevalence = useMemo(
    () => data.map((d: Data) => (d.prevalence ? d.prevalence : 0)).reduce((a, b) => Math.min(a, b), Infinity),
    [data]
  );
  const maxPrevalence = useMemo(
    () => data.map((d: Data) => (d.prevalence ? d.prevalence : 0)).reduce((a, b) => Math.max(a, b), 0),
    [data]
  );

  const metrics = [
    {
      value: focusData
        ? focusData.prevalence
          ? focusData.prevalence.toFixed(2)
          : 0
        : `${minPrevalence.toFixed(2)}-${maxPrevalence.toFixed(2)}`,
      title: focusData ? 'Prevalence' : 'Prevalence range',
      color: colors.active,
      helpText: 'Proportion relative to all samples collected from this age group.',
      percent: true,
    },
    {
      value: focusData ? focusData.count : data.length,
      title: focusData ? 'Samples' : 'Divisions with data',
      color: colors.secondary,
      helpText: focusData
        ? 'Number of samples of the variant collected from this age group.'
        : 'Number of divisions with prevalence data',
    },
  ];

  return (
    <ChartAndMetrics
      metrics={metrics}
      title={`Proportion of variant in ${focusData ? focusData.division : country}`}
      metricsTitle={focusData && focusData.division !== null ? focusData.division : undefined}
    >
      <Wrapper data={data} focusDivision={focusData ? focusData.division : null} className='pd-1 md:m-2'>
        {country === 'Switzerland' && <VectorMap {...switzerland} layerProps={layerProps} />}
        {country === 'Germany' && <VectorMap {...germany} layerProps={layerProps} />}
        {country === 'United States' && <VectorMap {...usa} layerProps={layerProps} />}
      </Wrapper>
    </ChartAndMetrics>
  );
};

export default Map;
