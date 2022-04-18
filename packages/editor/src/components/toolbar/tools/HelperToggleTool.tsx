import React, { useCallback, useState } from 'react'

import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { accessEngineState, EngineActions, useEngineState } from '@xrengine/engine/src/ecs/classes/EngineService'
import { ObjectLayers } from '@xrengine/engine/src/scene/constants/ObjectLayers'
import { dispatchAction } from '@xrengine/hyperflux'

import SelectAllIcon from '@mui/icons-material/SelectAll'
import SquareFootIcon from '@mui/icons-material/SquareFoot'

import { InfoTooltip } from '../../layout/Tooltip'
import * as styles from '../styles.module.scss'

export const HelperToggleTool = () => {
  const [, updateState] = useState<any>()
  const forceUpdate = useCallback(() => updateState({}), [])
  const engineState = useEngineState()

  const togglePhysicsDebug = () => {
    forceUpdate()
    dispatchAction(Engine.store, EngineActions.setPhysicsDebug(!accessEngineState().isPhysicsDebug.value) as any)
  }
  const toggleNodeHelpers = () => {
    Engine.camera.layers.toggle(ObjectLayers.NodeHelper)
    forceUpdate()
  }

  return (
    <>
      <div id="transform-grid" className={styles.toolbarInputGroup + ' ' + styles.playButtonContainer}>
        <InfoTooltip title="Toggle Physics Helpers">
          <button
            onClick={togglePhysicsDebug}
            className={styles.toolButton + ' ' + (engineState.isPhysicsDebug.value ? styles.selected : '')}
          >
            <SquareFootIcon fontSize="small" />
          </button>
        </InfoTooltip>
      </div>
      <div id="transform-grid" className={styles.toolbarInputGroup + ' ' + styles.playButtonContainer}>
        <InfoTooltip title="Toggle Node Helpers">
          <button
            onClick={toggleNodeHelpers}
            className={
              styles.toolButton + ' ' + (Engine.camera.layers.isEnabled(ObjectLayers.NodeHelper) ? styles.selected : '')
            }
          >
            <SelectAllIcon fontSize="small" />
          </button>
        </InfoTooltip>
      </div>
    </>
  )
}

export default HelperToggleTool
