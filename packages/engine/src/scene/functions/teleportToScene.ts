import { Euler } from 'three'

import { Engine } from '../../ecs/classes/Engine'
import { EngineEvents } from '../../ecs/classes/EngineEvents'
import { addComponent, getComponent } from '../../ecs/functions/ComponentFunctions'
import { unloadScene } from '../../ecs/functions/EngineFunctions'
import { unloadSystems } from '../../ecs/functions/SystemFunctions'
import { useWorld } from '../../ecs/functions/SystemHooks'
import { receiveActionOnce } from '../../networking/functions/matchActionOnce'
import { NetworkActionReceptor } from '../../networking/functions/NetworkActionReceptor'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { HyperspaceTagComponent } from '../components/HyperspaceTagComponent'

export const teleportToScene = async () => {
  const world = useWorld()
  console.log('teleportToScene', world.activePortal)
  Engine.hasJoinedWorld = false

  // trigger hyperspace effect by simply adding tag component to the world's entity
  addComponent(world.worldEntity, HyperspaceTagComponent, {})

  // remove all network clients but own (will be updated when new connection is established)
  NetworkActionReceptor.removeAllNetworkClients(world, false)

  // remove this scene's injected systems
  unloadSystems(world, true)

  // remove all entities that don't have PersistTags
  await unloadScene(world)

  // wait until the world has been joined
  await new Promise((resolve) => {
    receiveActionOnce(Engine.store, EngineEvents.EVENTS.JOINED_WORLD, resolve)
  })

  // teleport player to where the portal is
  const transform = getComponent(world.localClientEntity, TransformComponent)
  transform.position.copy(world.activePortal.remoteSpawnPosition)
  transform.rotation.setFromEuler(new Euler(0, world.activePortal.remoteSpawnEuler.y, 0, 'XYZ'))
}
