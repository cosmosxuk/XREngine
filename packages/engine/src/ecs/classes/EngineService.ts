import { createState, useState } from '@speigg/hookstate'

import { UserId } from '@xrengine/common/src/interfaces/UserId'

import { InteractableComponentType } from '../../interaction/components/InteractableComponent'
import { EngineEvents } from './EngineEvents'
import { Entity } from './Entity'

const state = createState({
  fixedTick: 0,
  isEngineInitialized: false,
  sceneLoading: false,
  sceneLoaded: false,
  joinedWorld: false,
  loadingProgress: 0,
  connectedWorld: false,
  isTeleporting: false,
  leaveWorld: false,
  socketInstance: false,
  connectionTimeoutInstance: false,
  avatarTappedId: null! as UserId,
  userHasInteracted: false,
  interactionData: null! as InteractableComponentType,
  xrSupported: false,
  errorEntities: {} as { [key: Entity]: boolean }
})

export function EngineEventReceptor(action: EngineActionType) {
  state.batch((s) => {
    switch (action.type) {
      case EngineEvents.EVENTS.BROWSER_NOT_SUPPORTED:
        break
      case EngineEvents.EVENTS.RESET_ENGINE:
        return s.merge({
          socketInstance: action.instance
        })
      case EngineEvents.EVENTS.USER_AVATAR_TAPPED:
        return s.merge({
          avatarTappedId: action.userId
        })
      case EngineEvents.EVENTS.INITIALIZED_ENGINE:
        return s.merge({ isEngineInitialized: action.initialised })
      case EngineEvents.EVENTS.SCENE_UNLOADED:
        return s.merge({ sceneLoaded: false, sceneLoading: false })
      case EngineEvents.EVENTS.SCENE_LOADING:
        return s.merge({ sceneLoaded: false, sceneLoading: true, loadingProgress: 0 })
      case EngineEvents.EVENTS.SCENE_LOADED: {
        return s.merge({ sceneLoaded: true, sceneLoading: false, loadingProgress: 100 })
      }
      case EngineEvents.EVENTS.JOINED_WORLD: {
        s.merge({ joinedWorld: true })
        if (s.sceneLoaded.value) {
          s.merge({ loadingProgress: 100 })
        }
        return
      }
      case EngineEvents.EVENTS.SCENE_LOADING_PROGRESS:
        return s.merge({ loadingProgress: action.progress })
      case EngineEvents.EVENTS.LEAVE_WORLD:
        return s.merge({ joinedWorld: false })
      case EngineEvents.EVENTS.CONNECT_TO_WORLD:
        return s.merge({ connectedWorld: action.connectedWorld })
      case EngineEvents.EVENTS.CONNECT_TO_WORLD_TIMEOUT:
        return s.merge({ connectionTimeoutInstance: action.instance })
      case EngineEvents.EVENTS.OBJECT_ACTIVATION:
        return s.merge({ interactionData: action.interactionData })
      case EngineEvents.EVENTS.SET_TELEPORTING:
        if (action.isTeleporting) {
          s.merge({
            connectedWorld: false,
            sceneLoaded: false,
            joinedWorld: false
          })
        }
        return s.merge({
          isTeleporting: action.isTeleporting
        })
      case EngineEvents.EVENTS.SET_USER_HAS_INTERACTED:
        return s.merge({ userHasInteracted: true })
      case EngineEvents.EVENTS.ENTITY_ERROR_UPDATE:
        s.errorEntities[action.entity].set(!action.isResolved)
        return
      case EngineEvents.EVENTS.XR_SUPPORTED:
        s.xrSupported.set(action.xrSupported)
        return
    }
  }, action.type)
}

export const useEngineState = () => useState(state) as any as typeof state
export const accessEngineState = () => state
export const EngineActions = {
  userAvatarTapped: (userId) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.USER_AVATAR_TAPPED,
      userId
    }
  },
  setTeleporting: (isTeleporting: boolean) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.SET_TELEPORTING,
      isTeleporting
    }
  },
  resetEngine: (instance: boolean) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.RESET_ENGINE,
      instance
    }
  },
  initializeEngine: (initialised: boolean) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.INITIALIZED_ENGINE,
      initialised
    }
  },
  connectToWorld: (connectedWorld: boolean) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.CONNECT_TO_WORLD,
      connectedWorld
    }
  },
  connectToWorldTimeout: (instance: boolean) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.CONNECT_TO_WORLD_TIMEOUT,
      instance
    }
  },
  joinedWorld: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.JOINED_WORLD
    }
  },
  leaveWorld: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.LEAVE_WORLD
    }
  },
  sceneLoading: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.SCENE_LOADING
    }
  },
  sceneLoaded: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.SCENE_LOADED
    }
  },
  sceneUnloaded: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.SCENE_UNLOADED
    }
  },
  sceneLoadingProgress: (progress: number) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.SCENE_LOADING_PROGRESS,
      progress
    }
  },
  ////////////////
  enableScene: (env: any) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.ENABLE_SCENE,
      env
    }
  },

  objectActivation: (interactionData: InteractableComponentType) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.OBJECT_ACTIVATION,
      interactionData
    }
  },

  xrStart: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.XR_START
    }
  },
  xrSession: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.XR_SESSION
    }
  },
  xrEnd: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.XR_END
    }
  },
  connect: (id: any) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.CONNECT,
      id
    }
  },
  startSuspendedContexts: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.START_SUSPENDED_CONTEXTS
    }
  },
  suspendPositionalAudio: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.SUSPEND_POSITIONAL_AUDIO
    }
  },
  browserNotSupported: (msg: string) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.BROWSER_NOT_SUPPORTED,
      msg
    }
  },
  setUserHasInteracted: () => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.SET_USER_HAS_INTERACTED
    }
  },
  updateEntityError: (entity: Entity, isResolved = false) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.ENTITY_ERROR_UPDATE,
      entity,
      isResolved
    }
  },
  xrSupported: (xrSupported: boolean) => {
    return {
      store: 'ENGINE' as const,
      type: EngineEvents.EVENTS.XR_SUPPORTED,
      xrSupported
    }
  }
}

export type EngineActionType = ReturnType<typeof EngineActions[keyof typeof EngineActions]>
