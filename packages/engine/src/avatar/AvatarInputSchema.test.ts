import assert from 'assert'
import { Vector3 } from 'three'

import { FollowCameraComponent, FollowCameraDefaultValues } from '../camera/components/FollowCameraComponent'
import { TargetCameraRotationComponent } from '../camera/components/TargetCameraRotationComponent'
import { LifecycleValue } from '../common/enums/LifecycleValue'
import { NumericalType } from '../common/types/NumericalTypes'
import { Engine } from '../ecs/classes/Engine'
import { createWorld, World } from '../ecs/classes/World'
import { addComponent, getComponent } from '../ecs/functions/ComponentFunctions'
import { createEntity } from '../ecs/functions/EntityFunctions'
import { InputType } from '../input/enums/InputType'
import { VectorSpringSimulator } from '../physics/classes/springs/VectorSpringSimulator'
import { CollisionGroups } from '../physics/enums/CollisionGroups'
import {
  fixedCameraBehindAvatar,
  setTargetCameraRotation,
  switchShoulderSide,
  toggleRunning
} from './AvatarInputSchema'
import { AvatarControllerComponent } from './components/AvatarControllerComponent'

describe('avatarInputSchema', () => {
  let world: World

  beforeEach(async () => {
    world = createWorld()
    Engine.currentWorld = world
    delete (globalThis as any).PhysX
    await world.physics.createScene()
  })

  it('check fixedCameraBehindAvatar', () => {
    const entity = createEntity(world)

    const follower = addComponent(entity, FollowCameraComponent, FollowCameraDefaultValues)
    const firstValue = follower.locked
    fixedCameraBehindAvatar(entity, 'Test', {
      type: InputType.ONEDIM,
      value: [1] as NumericalType,
      lifecycleState: LifecycleValue.Started
    })

    assert(firstValue === !follower.locked)
  })

  it('check switchShoulderSide', () => {
    const entity = createEntity(world)

    const follower = addComponent(entity, FollowCameraComponent, FollowCameraDefaultValues)
    const firstValue = follower.shoulderSide
    switchShoulderSide(entity, 'Test', {
      type: InputType.ONEDIM,
      value: [1] as NumericalType,
      lifecycleState: LifecycleValue.Started
    })

    assert(firstValue === !follower.shoulderSide)
  })

  it('check setTargetCameraRotation', () => {
    const entity = createEntity(world)

    const phi = 5
    const theta = 4

    setTargetCameraRotation(entity, phi, theta)
    const tcr = getComponent(entity, TargetCameraRotationComponent)

    assert(tcr.phi === phi)
    assert(tcr.theta === theta)
  })

  it('check setTargetCameraRotation with having the component already', () => {
    const entity = createEntity(world)

    const tcr = addComponent(entity, TargetCameraRotationComponent, {
      phi: 1,
      phiVelocity: { value: 0 },
      theta: 2,
      thetaVelocity: { value: 0 },
      time: 0.3
    })

    const phi = 5
    const theta = 4

    setTargetCameraRotation(entity, phi, theta)

    assert(tcr.phi === phi)
    assert(tcr.theta === theta)
  })

  it('check setWalking', async () => {
    await Engine.currentWorld.physics.createScene({ verbose: true })
    const entity = createEntity(world)

    const controller = world.physics.createController({
      isCapsule: true,
      material: world.physics.createMaterial(),
      position: {
        x: 0,
        y: 10,
        z: 0
      },
      contactOffset: 0.01,
      stepOffset: 0.25,
      slopeLimit: 0,
      height: 20,
      radius: 4,
      userData: {
        entity
      }
    }) as PhysX.PxCapsuleController

    const velocitySimulator = new VectorSpringSimulator(60, 50, 0.8)
    const c = addComponent(entity, AvatarControllerComponent, {
      controller,
      filterData: new PhysX.PxFilterData(
        CollisionGroups.Avatars,
        CollisionGroups.Default | CollisionGroups.Ground | CollisionGroups.Trigger,
        0,
        0
      ),
      currentSpeed: 0,
      speedVelocity: { value: 0 },
      collisions: [false, false, false],
      movementEnabled: true,
      isJumping: false,
      isWalking: false,
      localMovementDirection: new Vector3(),
      velocitySimulator
    })

    const firstValue = c.isWalking

    toggleRunning(entity, 'Test', {
      type: InputType.ONEDIM,
      value: [1] as NumericalType,
      lifecycleState: LifecycleValue.Started
    })

    assert(firstValue === !c.isWalking)
  })
})
