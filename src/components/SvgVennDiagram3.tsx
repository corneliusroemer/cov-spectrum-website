import { useExploreUrl } from '../helpers/explore-url';
import ReactTooltip from 'react-tooltip';
import { LapisSelector } from '../data/LapisSelector';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '../helpers/query-hook';
import { MutationProportionData } from '../data/MutationProportionDataset';
import { ReferenceGenomeService } from '../services/ReferenceGenomeService';
import Loader from './Loader';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Slider from 'rc-slider';
import { useResizeDetector } from 'react-resize-detector';
import './style/svgPlots.css';
import { vennIntersections } from '../helpers/intersections';

import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import { Utils } from '../services/Utils';
import { MutationListFormat, VennData } from './SvgVennDiagram4';
import { formatVariantDisplayName, VariantSelector } from '../data/VariantSelector';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export interface Props {
  selectors: LapisSelector[];
}

export const SvgVennDiagram3 = ({ selectors }: Props) => {
  const [geneName, setGeneName] = useState<string[]>([]);

  const handleChange = (event: SelectChangeEvent<typeof geneName>) => {
    const {
      target: { value },
    } = event;
    setGeneName(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

  const { ref } = useResizeDetector<HTMLDivElement>();

  const [minProportion, setMinProportion] = useState(0.5);

  const res = useQuery(
    signal => Promise.all(selectors.map(selector => MutationProportionData.fromApi(selector, 'aa', signal))),
    [selectors],
    useEffect
  );

  const exploreUrl = useExploreUrl()!;
  const variants = exploreUrl.variants;

  const data = useMemo(() => {
    if (!res.data || res.data.length !== 3) {
      return undefined;
    }
    if (res.data && res.data.length === 3) {
      const [variant1, variant2, variant3] = res.data;

      const variant1Mutations = variant1.payload
        .filter(m => m.proportion >= minProportion)
        .map(m => m.mutation);
      const variant2Mutations = variant2.payload
        .filter(m => m.proportion >= minProportion)
        .map(m => m.mutation);
      const variant3Mutations = variant3.payload
        .filter(m => m.proportion >= minProportion)
        .map(m => m.mutation);

      return vennIntersections(variant1Mutations, variant2Mutations, variant3Mutations);
    }
  }, [res.data, minProportion]);

  // Filter the mutations by gene
  const filteredData = useMemo(() => {
    if (!data) {
      return undefined;
    }
    if (geneName.length > 0) {
      return data.map(old => ({
        ...old,
        values: old.values.filter(value => geneName.includes(value.split(':')[0])),
      }));
    }
    return data;
  }, [data, geneName]);

  // Transform the general VennIntersectionsResult object to Venn2Data.
  const venn3Data: VennData | undefined = useMemo(() => {
    if (!filteredData) {
      return undefined;
    }
    const findSet = (variants: number[]): string[] =>
      filteredData.find(({ indicesOfSets }) => Utils.setEquals(new Set(variants), new Set(indicesOfSets)))
        ?.values ?? [];
    return [
      {
        mutations: findSet([0]),
        svgTransform: 'matrix(1 0 0 1 548.3361 206.3148)',
      },
      {
        mutations: findSet([1]),
        svgTransform: 'matrix(1 0 0 1 182.8677 823.3275)',
      },
      {
        mutations: findSet([2]),
        svgTransform: 'matrix(1 0 0 1 963.0196 823.3275)',
      },
      {
        mutations: findSet([0, 1, 2]),
        svgTransform: 'matrix(1 0 0 1 548.3361 620.9984)',
      },
      {
        mutations: findSet([0, 1]),
        svgTransform: 'matrix(1 0 0 1 307.7284 511.6313)',
      },
      {
        mutations: findSet([0, 2]),
        svgTransform: 'matrix(1 0 0 1 808.9943 511.6313)',
      },
      {
        mutations: findSet([1, 2]),
        svgTransform: 'matrix(1 0 0 1 548.3361 935.4288)',
      },
    ];
  }, [filteredData]);

  if (selectors.length !== 3) {
    throw new Error(
      `<VariantMutationComparison> is used with ${selectors.length} variants, ` +
        'but this component only supports comparisons of 3  variants.'
    );
  }
  if (res.isError) {
    throw new Error('Data fetching failed: ' + JSON.stringify(res.error));
  }
  if (res.isLoading || !res.data || !venn3Data || !variants) {
    return <Loader />;
  }

  const variantTexts: {
    transform: string;
    variant: VariantSelector;
  }[] = [
    {
      transform: 'matrix(1 0 0 1 897.6821 99.9163)',
      variant: variants[0],
    },
    {
      transform: 'matrix(1 0 0 1 9.3525 1110.3396)',
      variant: variants[1],
    },
    {
      transform: 'matrix(1 0 0 1 969.281 1110.3396)',
      variant: variants[2],
    },
  ];

  return (
    <>
      {variants && variants.length === 3 && data && (
        <>
          <div>
            A mutation is considered as belonging to a variant if at least{' '}
            <OverlayTrigger
              trigger='click'
              overlay={
                <Tooltip id='mutationMinProportion'>
                  <div>
                    <Slider
                      value={Math.round(minProportion * 100)}
                      min={5}
                      max={100}
                      step={5}
                      onChange={value => setMinProportion(value / 100)}
                      style={{ width: '100px' }}
                    />
                  </div>
                </Tooltip>
              }
              rootClose={true}
              placement='bottom'
            >
              <span className='cursor-pointer px-3 rounded bg-gray-100 hover:bg-gray-300 font-bold'>
                {(minProportion * 100).toFixed(0)}%
              </span>
            </OverlayTrigger>{' '}
            of the samples of the variant have the mutation.{' '}
            <b>Click on the number of the mutations inside the diagram to copy the mutations to clipboard.</b>{' '}
            You can filter the genes: if nothing is selected, all genes are included.
          </div>

          <div>
            <FormControl sx={{ m: 1, width: 300 }} size='small'>
              <InputLabel id='demo-multiple-checkbox-label'>Select genes</InputLabel>
              <Select
                labelId='demo-multiple-checkbox-label'
                id='demo-multiple-checkbox'
                multiple
                value={geneName}
                onChange={handleChange}
                input={<OutlinedInput label='Select genes' />}
                renderValue={selected => selected.join(', ')}
                MenuProps={MenuProps}
                placeholder='All'
              >
                {ReferenceGenomeService.genes.sort().map(gene => (
                  <MenuItem key={gene} value={gene}>
                    <Checkbox checked={geneName.indexOf(gene) > -1} />
                    <ListItemText primary={gene} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div ref={ref} style={{ maxWidth: '500px', margin: 'auto' }}>
            <svg
              version='1.1'
              id='Layer_1'
              xmlns='http://www.w3.org/2000/svg'
              x='0px'
              y='0px'
              viewBox='0 0 1500 1127.39'
              className='svgPlot3'
            >
              <g>
                <path
                  className='st0'
                  d='M918.61,617.78c-14.38,21.28-30.89,41.3-49.08,59.48c-18.19,18.19-38.2,34.7-59.48,49.08
		c-6.31,4.27-12.76,8.35-19.31,12.25c-0.65,52.44-11.26,103.32-31.56,151.32c-10.08,23.82-22.54,46.79-37.06,68.28
		c-14.38,21.28-30.89,41.3-49.08,59.48c-18.19,18.19-38.2,34.7-59.48,49.08c-3.37,2.28-6.78,4.5-10.22,6.67
		c53.35,28.12,114.08,44.05,178.46,44.05c211.75,0,384.02-172.27,384.02-384.02c0-136.36-71.45-256.35-178.87-324.5
		c-1.88,48.64-12.37,95.85-31.28,140.55C945.59,573.32,933.12,596.29,918.61,617.78z'
                />
                <path
                  className='st0'
                  d='M497.57,1017.67c-18.19-18.19-34.7-38.2-49.08-59.48c-14.52-21.49-26.99-44.46-37.06-68.28
		c-20.3-47.99-30.91-98.87-31.56-151.32c-6.55-3.9-13-7.99-19.31-12.25c-21.28-14.38-41.3-30.89-59.48-49.08
		c-18.19-18.19-34.7-38.2-49.08-59.48c-14.52-21.49-26.99-44.46-37.06-68.28c-18.91-44.7-29.4-91.91-31.28-140.55
		C76.23,477.1,4.79,597.08,4.79,733.45c0,211.75,172.27,384.02,384.02,384.02c64.38,0,125.11-15.93,178.46-44.05
		c-3.44-2.17-6.85-4.39-10.22-6.67C535.77,1052.37,515.75,1035.86,497.57,1017.67z'
                />
                <path
                  className='st0'
                  d='M772.52,748.82c-10.05,5.3-20.32,10.17-30.76,14.59c-49.56,20.96-102.2,31.59-156.46,31.59
		c-54.26,0-106.9-10.63-156.46-31.59c-10.43-4.41-20.7-9.28-30.76-14.59c5.28,133.57,79.12,249.82,187.22,314.47
		C693.4,998.64,767.24,882.39,772.52,748.82z'
                />
                <path
                  className='st0'
                  d='M388.81,331.49c54.26,0,106.9,10.63,156.46,31.59c13.66,5.78,27.05,12.35,40.03,19.64
		c12.99-7.29,26.37-13.86,40.03-19.64c49.56-20.96,102.2-31.59,156.46-31.59c54.26,0,106.9,10.63,156.46,31.59
		c10.43,4.41,20.7,9.28,30.76,14.59C960.92,173.01,791.9,9.01,585.3,9.01s-375.62,164-383.71,368.65
		c10.05-5.3,20.32-10.17,30.76-14.59C281.9,342.12,334.55,331.49,388.81,331.49z'
                />
                <path
                  className='st0'
                  d='M603.33,393.47c3.44,2.17,6.85,4.39,10.22,6.67c21.28,14.38,41.3,30.89,59.48,49.08
		c18.19,18.19,34.7,38.2,49.08,59.48c14.52,21.49,26.99,44.46,37.06,68.28c18.91,44.7,29.4,91.91,31.28,140.55
		c106.01-67.26,176.99-185,178.83-319.15c-55.48-31.17-119.45-48.96-187.49-48.96C717.41,349.43,656.68,365.35,603.33,393.47z'
                />
                <path
                  className='st0'
                  d='M380.15,717.53c1.88-48.64,12.37-95.85,31.28-140.55c10.07-23.82,22.54-46.79,37.06-68.28
		c14.38-21.28,30.89-41.3,49.08-59.48c18.19-18.19,38.2-34.7,59.48-49.08c3.37-2.28,6.78-4.5,10.22-6.67
		c-53.35-28.12-114.08-44.05-178.46-44.05c-68.04,0-132,17.79-187.49,48.96C203.16,532.53,274.13,650.27,380.15,717.53z'
                />
                <path
                  className='st0'
                  d='M397.81,728.1c55.48,31.17,119.45,48.96,187.49,48.96c68.04,0,132-17.79,187.49-48.96
		c-1.89-137.77-76.7-258.23-187.49-324.48C474.51,469.86,399.71,590.33,397.81,728.1z'
                />
              </g>
              {venn3Data.map(({ svgTransform, mutations }, index) => (
                <text
                  transform={svgTransform}
                  className='st1 st2 svgPlotNumber'
                  data-for={`venn-area-${index}`}
                  data-tip
                  onClick={() => navigator.clipboard.writeText(mutations.join(','))}
                >
                  {mutations.length}
                </text>
              ))}
              {variantTexts.map(({ transform, variant }) => (
                <text transform={transform} className='svgPlotText'>
                  {formatVariantDisplayName(variant)}
                </text>
              ))}
            </svg>
            {venn3Data.map(({ mutations }, index) => (
              <ReactTooltip id={`venn-area-${index}`} key={`venn-area-${index}`}>
                {mutations.length ? MutationListFormat(mutations) : '-'}
              </ReactTooltip>
            ))}
          </div>
        </>
      )}
    </>
  );
};