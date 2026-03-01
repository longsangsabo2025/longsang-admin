/**
 * Brain API Client
 * Composed from domain-specific modules via mixins
 */

import { BrainAPIBase } from './brain-api-base';
import { withCoreMethods } from './brain-api-core';
import { withBulkMethods } from './brain-api-bulk';
import { withMultiMethods } from './brain-api-multi';
import { withPhase5Methods } from './brain-api-phase5';
import { withPhase6Methods } from './brain-api-phase6';

const BrainAPIMixed = withPhase6Methods(
  withPhase5Methods(
    withMultiMethods(
      withBulkMethods(
        withCoreMethods(BrainAPIBase)
      )
    )
  )
);

/**
 * Brain API Client Class
 */
export class BrainAPI extends BrainAPIMixed {}

// Export singleton instance
export const brainAPI = new BrainAPI();
