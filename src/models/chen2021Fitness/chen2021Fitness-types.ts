import * as zod from 'zod';
import { LocationSelector } from '../../data/LocationSelector';
import { VariantSelector } from '../../data/VariantSelector';
import { SamplingStrategy } from '../../data/SamplingStrategy';

export type Chen2021FitnessRequest = {
  location: LocationSelector;
  variant: VariantSelector;
  samplingStrategy: SamplingStrategy;
  alpha: number;
  generationTime: number;
  reproductionNumberWildtype: number;
  plotStartDate: Date;
  plotEndDate: Date;
  initialWildtypeCases: number;
  initialVariantCases: number;
};

export const ValueWithCISchema = zod.object({
  value: zod.number(),
  ciLower: zod.number(),
  ciUpper: zod.number(),
});

export const Chen2021FitnessResponseSchema = zod.object({
  daily: zod.object({
    t: zod.array(zod.string()),
    proportion: zod.array(zod.number()),
    ciLower: zod.array(zod.number()),
    ciUpper: zod.array(zod.number()),
  }),
  params: zod.object({
    a: ValueWithCISchema,
    t0: ValueWithCISchema,
    fc: ValueWithCISchema,
    fd: ValueWithCISchema,
  }),
  plotAbsoluteNumbers: zod.object({
    t: zod.array(zod.string()),
    variantCases: zod.array(zod.number()),
    wildtypeCases: zod.array(zod.number()),
  }),
  plotProportion: zod.object({
    t: zod.array(zod.string()),
    proportion: zod.array(zod.number()),
    ciLower: zod.array(zod.number()),
    ciUpper: zod.array(zod.number()),
  }),
});

export type ValueWithCI = zod.infer<typeof ValueWithCISchema>;
export type Chen2021FitnessResponse = zod.infer<typeof Chen2021FitnessResponseSchema>;
