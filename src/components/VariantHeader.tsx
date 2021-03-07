import React from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { AccountService } from '../services/AccountService';
import { Country, Variant } from '../services/api-types';
import { NextcladeService } from '../services/NextcladeService';
import { LazySampleButton } from './LazySampleButton';
import { MutationList } from './MutationList';

export interface Props {
  country: Country;
  matchPercentage: number;
  variant: Variant;
}

export const VariantHeader = ({ country, matchPercentage, variant }: Props) => {
  const nextcladeButton = (
    <Button
      onClick={() => NextcladeService.showVariantOnNextclade(variant, matchPercentage, country)}
      variant='outline-dark'
      size='sm'
      className='mr-2'
    >
      Show on Nextclade
    </Button>
  );

  return (
    <>
      <div style={{ display: 'flex' }}>
        <h1 style={{ flexGrow: 1 }}>{variant.name ?? 'Unnamed Variant'}</h1>
        <div>
          {AccountService.isLoggedIn() && nextcladeButton}
          {!AccountService.isLoggedIn() && country === 'Switzerland' && (
            <OverlayTrigger
              placement='bottom'
              overlay={
                <Tooltip id='tooltip-show-on-nextclade'>
                  Due to licensing reasons, we can currently only provide sequences submitted by the D-BSSE,
                  ETHZ for an analysis on Nextclade.
                </Tooltip>
              }
            >
              {nextcladeButton}
            </OverlayTrigger>
          )}
          <LazySampleButton
            query={{ mutations: variant.mutations, country, matchPercentage }}
            variant='outline-dark'
            size='sm'
          >
            Show samples
          </LazySampleButton>
        </div>
      </div>

      <p>
        <b>Mutations:</b> <MutationList mutations={variant.mutations} />
      </p>

      <p style={{ marginBottom: '30px' }}>
        The following plots show sequences matching <b>{Math.round(matchPercentage * 100)}%</b> of the
        mutations.
      </p>
    </>
  );
};