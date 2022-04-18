import {
  BloomEffect,
  BrightnessContrastEffect,
  ColorDepthEffect,
  DepthOfFieldEffect,
  EffectComposer,
  HueSaturationEffect,
  NormalPass,
  OutlineEffect,
  RenderPass,
  SMAAEffect,
  SSAOEffect,
  ToneMappingEffect
} from 'postprocessing'
import { PerspectiveCamera, sRGBEncoding, WebGL1Renderer, WebGLRenderer, WebGLRendererParameters } from 'three'

import { addActionReceptor, dispatchAction } from '@xrengine/hyperflux'

import { ClientStorage } from '../common/classes/ClientStorage'
import { ExponentialMovingAverage } from '../common/classes/ExponentialAverageCurve'
import { nowMilliseconds } from '../common/functions/nowMilliseconds'
import { Engine } from '../ecs/classes/Engine'
import { EngineEvents } from '../ecs/classes/EngineEvents'
import { accessEngineState, EngineActions, EngineActionType } from '../ecs/classes/EngineService'
import { World } from '../ecs/classes/World'
import { receiveActionOnce } from '../networking/functions/matchActionOnce'
import { LinearTosRGBEffect } from './effects/LinearTosRGBEffect'
import { accessEngineRendererState, EngineRendererAction, EngineRendererReceptor } from './EngineRendererState'
import { databasePrefix, RENDERER_SETTINGS } from './EngineRnedererConstants'
import { configureEffectComposer } from './functions/configureEffectComposer'
import WebGL from './THREE.WebGL'

export interface EffectComposerWithSchema extends EffectComposer {
  OutlineEffect: OutlineEffect
  // FXAAEffect: FXAAEffect
  SMAAEffect: SMAAEffect
  SSAOEffect: SSAOEffect
  DepthOfFieldEffect: DepthOfFieldEffect
  BloomEffect: BloomEffect
  ToneMappingEffect: ToneMappingEffect
  BrightnessContrastEffect: BrightnessContrastEffect
  HueSaturationEffect: HueSaturationEffect
  ColorDepthEffect: ColorDepthEffect
  LinearTosRGBEffect: LinearTosRGBEffect
}

let lastRenderTime = 0

export class EngineRenderer {
  static instance: EngineRenderer

  /** Is resize needed? */
  needsResize: boolean

  /** Maximum Quality level of the rendered. **Default** value is 5. */
  maxQualityLevel = 5
  /** point at which we downgrade quality level (large delta) */
  maxRenderDelta = 1000 / 28 // 28 fps = 35 ms  (on some devices, rAF updates at 30fps, e.g., Low Power Mode)
  /** point at which we upgrade quality level (small delta) */
  minRenderDelta = 1000 / 55 // 55 fps = 18 ms
  /** Resoulion scale. **Default** value is 1. */
  scaleFactor = 1

  renderPass: RenderPass
  normalPass: NormalPass
  renderContext: WebGLRenderingContext | WebGL2RenderingContext

  supportWebGL2: boolean
  rendereringEnabled = true
  canvas: HTMLCanvasElement

  averageFrameTime = 1000 / 60
  timeSamples = new Array(60 * 1).fill(1000 / 60) // 3 seconds @ 60fps
  index = 0

  averageTimePeriods = 3 * 60 // 3 seconds @ 60fps
  /** init ExponentialMovingAverage */
  movingAverage = new ExponentialMovingAverage(this.averageTimePeriods)

  /** To Disable update for renderer */
  disableUpdate = false

  /** Constructs WebGL Renderer System. */
  constructor() {
    EngineRenderer.instance = this
    this.onResize = this.onResize.bind(this)

    this.supportWebGL2 = WebGL.isWebGL2Available()

    if (!this.supportWebGL2 && !WebGL.isWebGLAvailable()) {
      WebGL.dispatchWebGLDisconnectedEvent()
    }

    const canvas: HTMLCanvasElement = document.querySelector('canvas')!
    const context = this.supportWebGL2 ? canvas.getContext('webgl2')! : canvas.getContext('webgl')!

    if (!context) {
      dispatchAction(
        Engine.store,
        EngineActions.browserNotSupported(
          'Your browser does not have WebGL enabled. Please enable WebGL, or try another browser.'
        ) as any
      )
    }

    this.renderContext = context!
    const options: WebGLRendererParameters = {
      precision: 'highp',
      powerPreference: 'high-performance',
      stencil: false,
      antialias: false,
      depth: false,
      canvas,
      context,
      preserveDrawingBuffer: !Engine.isHMD
    }

    this.canvas = canvas

    canvas.ondragstart = (e) => {
      e.preventDefault()
      return false
    }

    const renderer = this.supportWebGL2 ? new WebGLRenderer(options) : new WebGL1Renderer(options)
    Engine.renderer = renderer
    Engine.renderer.physicallyCorrectLights = true
    Engine.renderer.outputEncoding = sRGBEncoding

    // DISABLE THIS IF YOU ARE SEEING SHADER MISBEHAVING - UNCHECK THIS WHEN TESTING UPDATING THREEJS
    Engine.renderer.debug.checkShaderErrors = false

    Engine.xrManager = renderer.xr
    //@ts-ignore
    renderer.xr.cameraAutoUpdate = false
    Engine.xrManager.enabled = true

    window.addEventListener('resize', this.onResize, false)
    this.onResize()

    Engine.renderer.autoClear = true
    Engine.effectComposer = new EffectComposer(Engine.renderer) as any

    configureEffectComposer()

    addActionReceptor(Engine.store, (action: EngineActionType) => {
      switch (action.type) {
        case EngineEvents.EVENTS.ENABLE_SCENE:
          if (typeof action.env.renderer !== 'undefined') this.rendereringEnabled = action.env.renderer
          break
      }
    })
  }

  /** Called on resize, sets resize flag. */
  onResize(): void {
    this.needsResize = true
  }

  /**
   * Executes the system. Called each frame by default from the Engine.
   * @param delta Time since last frame.
   */
  execute(delta: number): void {
    if (Engine.xrManager.isPresenting) {
      Engine.csm?.update()
      Engine.renderer.render(Engine.scene, Engine.camera)
    } else {
      const state = accessEngineRendererState()
      const engineState = accessEngineState()
      if (state.automatic.value && engineState.joinedWorld.value) this.changeQualityLevel()
      if (this.rendereringEnabled) {
        if (this.needsResize) {
          const curPixelRatio = Engine.renderer.getPixelRatio()
          const scaledPixelRatio = window.devicePixelRatio * this.scaleFactor

          if (curPixelRatio !== scaledPixelRatio) Engine.renderer.setPixelRatio(scaledPixelRatio)

          const width = window.innerWidth
          const height = window.innerHeight

          if ((Engine.camera as PerspectiveCamera).isPerspectiveCamera) {
            const cam = Engine.camera as PerspectiveCamera
            cam.aspect = width / height
            cam.updateProjectionMatrix()
          }

          state.qualityLevel.value > 0 && Engine.csm?.updateFrustums()
          // Effect composer calls renderer.setSize internally
          Engine.effectComposer.setSize(width, height, true)
          this.needsResize = false
        }

        state.qualityLevel.value > 0 && Engine.csm?.update()
        if (state.usePostProcessing.value) {
          Engine.effectComposer.render(delta)
        } else {
          Engine.renderer.autoClear = true
          Engine.renderer.render(Engine.scene, Engine.camera)
        }
      }
    }
  }

  /**
   * Change the quality of the renderer.
   */
  changeQualityLevel(): void {
    const time = nowMilliseconds()
    const delta = time - lastRenderTime
    lastRenderTime = time

    const state = accessEngineRendererState()
    let qualityLevel = state.qualityLevel.value

    this.movingAverage.update(Math.min(delta, 50))
    const averageDelta = this.movingAverage.mean

    if (averageDelta > this.maxRenderDelta && qualityLevel > 1) {
      qualityLevel--
    } else if (averageDelta < this.minRenderDelta && qualityLevel < this.maxQualityLevel) {
      qualityLevel++
    }

    if (qualityLevel !== state.qualityLevel.value) {
      dispatchAction(Engine.store, EngineRendererAction.setQualityLevel(qualityLevel))
    }
  }

  doAutomaticRenderQuality() {
    const state = accessEngineRendererState()
    dispatchAction(Engine.store, EngineRendererAction.setShadows(state.qualityLevel.value > 1))
    dispatchAction(Engine.store, EngineRendererAction.setQualityLevel(state.qualityLevel.value))
    dispatchAction(Engine.store, EngineRendererAction.setPostProcessing(state.qualityLevel.value > 2))
  }

  async loadGraphicsSettingsFromStorage() {
    const [automatic, qualityLevel, useShadows, /* pbr, */ usePostProcessing] = await Promise.all([
      ClientStorage.get(databasePrefix + RENDERER_SETTINGS.AUTOMATIC) as Promise<boolean>,
      ClientStorage.get(databasePrefix + RENDERER_SETTINGS.QUALITY_LEVEL) as Promise<number>,
      ClientStorage.get(databasePrefix + RENDERER_SETTINGS.USE_SHADOWS) as Promise<boolean>,
      // ClientStorage.get(databasePrefix + RENDERER_SETTINGS.PBR) as Promise<boolean>,
      ClientStorage.get(databasePrefix + RENDERER_SETTINGS.POST_PROCESSING) as Promise<boolean>
    ])
    dispatchAction(Engine.store, EngineRendererAction.setAutomatic(automatic ?? true))
    dispatchAction(Engine.store, EngineRendererAction.setQualityLevel(qualityLevel ?? 1))
    dispatchAction(Engine.store, EngineRendererAction.setShadows(useShadows ?? true))
    // dispatchAction(Engine.store, EngineRendererAction.setPBR(pbr ?? true))
    dispatchAction(Engine.store, EngineRendererAction.setPostProcessing(usePostProcessing ?? true))
  }
}

export default async function WebGLRendererSystem(world: World) {
  new EngineRenderer()

  receiveActionOnce(Engine.store, EngineEvents.EVENTS.JOINED_WORLD, () =>
    EngineRenderer.instance.loadGraphicsSettingsFromStorage()
  )

  addActionReceptor(Engine.store, EngineRendererReceptor)

  return () => {
    EngineRenderer.instance.execute(world.delta)
  }
}

globalThis.EngineRenderer = EngineRenderer
