import React from 'react'

import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'

import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'

import { enterPlayMode, leavePlayMode } from '../../../controls/PlayModeControls'
import { useEditorHelperState } from '../../../services/EditorHelperState'
import { InfoTooltip } from '../../layout/Tooltip'
import * as styles from '../styles.module.scss'

const PlayModeTool = () => {
  const editorHelperState = useEditorHelperState()

  const onTogglePlayMode = () => {
    if (editorHelperState.isPlayModeEnabled.value) {
      leavePlayMode()
    } else {
      enterPlayMode()
    }
  }

  return (
    <div className={styles.toolbarInputGroup + ' ' + styles.playButtonContainer} id="preview">
      <InfoTooltip title={editorHelperState.isPlayModeEnabled.value ? 'Stop Previewing Scene' : 'Preview Scene'}>
        <button
          disabled={!Engine.instance.sceneLoaded}
          onClick={onTogglePlayMode}
          className={styles.toolButton + ' ' + (editorHelperState.isPlayModeEnabled.value ? styles.selected : '')}
        >
          {editorHelperState.isPlayModeEnabled.value ? (
            <PauseIcon fontSize="small" />
          ) : (
            <PlayArrowIcon fontSize="small" />
          )}
        </button>
      </InfoTooltip>
    </div>
  )
}

export default PlayModeTool
