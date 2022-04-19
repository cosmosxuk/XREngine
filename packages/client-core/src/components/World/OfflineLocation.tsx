import React from 'react'

import { useAuthState } from '@xrengine/client-core/src/user/services/AuthService'
import { UserId } from '@xrengine/common/src/interfaces/UserId'
import { SpawnPoints } from '@xrengine/engine/src/avatar/AvatarSpawnSystem'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { useEngineState } from '@xrengine/engine/src/ecs/classes/EngineService'
import { receiveJoinWorld } from '@xrengine/engine/src/networking/functions/receiveJoinWorld'
import { useHookEffect } from '@xrengine/hyperflux'

import { client } from '../../feathers'
import GameServerWarnings from './GameServerWarnings'

export const OfflineLocation = () => {
  const engineState = useEngineState()
  const authState = useAuthState()

  /** OFFLINE */
  useHookEffect(async () => {
    if (engineState.sceneLoaded.value) {
      const world = Engine.currentWorld
      const userId = authState.authUser.identityProvider.userId.value
      Engine.userId = userId
      world.hostId = Engine.userId as UserId

      const index = 1
      world.userIdToUserIndex.set(userId, index)
      world.userIndexToUserId.set(index, userId)
      world.clients.set(userId, {
        userId: userId,
        index: index,
        name: authState.user.name.value,
        subscribedChatUpdates: []
      })

      const user = await client.service('user').get(Engine.userId)
      const avatarDetails = await client.service('avatar').get(user.avatarId!)

      const avatarSpawnPose = SpawnPoints.instance.getRandomSpawnPoint()
      receiveJoinWorld({
        elapsedTime: 0,
        clockTime: Date.now(),
        client: {
          index: 1,
          name: authState.user.name.value
        },
        cachedActions: [],
        avatarDetail: {
          avatarURL: avatarDetails.avatarURL,
          thumbnailURL: avatarDetails.thumbnailURL!
        },
        avatarSpawnPose
      })
    }
  }, [engineState.connectedWorld, engineState.sceneLoaded])

  return <GameServerWarnings />
}

export default OfflineLocation
