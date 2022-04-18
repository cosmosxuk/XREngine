import matches, { Validator } from 'ts-matches'

import { addActionReceptor, removeActionReceptor } from '@xrengine/hyperflux'
import { HyperStore } from '@xrengine/hyperflux/functions/StoreFunctions'

import { EngineActionType } from '../../ecs/classes/EngineService'

/**
 *
 * @param match the action to match to
 * @param callback the logic to run - returning truthy will cause the receptor to be removed
 */

export const matchActionOnce = <A, B>(store: HyperStore, match: Validator<A, B>, callback: (match: B) => boolean) => {
  function receptor(action) {
    matches(action).when(match, cb)
  }
  function cb(ac) {
    if (callback(ac)) {
      removeActionReceptor(store, receptor)
    }
  }
  addActionReceptor(store, receptor)
}

export const receiveActionOnce = (store: HyperStore, action: string, callback: (a: EngineActionType) => any) => {
  function receiveActionOnceReceptor(a: EngineActionType) {
    if (a.type === action) {
      removeActionReceptor(store, receiveActionOnceReceptor)
      callback(a)
    }
  }
  addActionReceptor(store, receiveActionOnceReceptor)
}
