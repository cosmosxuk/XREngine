import { System } from "ecsy"
import InputActionHandler from "../components/InputActionHandler"
import InputAxisHandler2D from "../components/InputAxisHandler2D"
import InputReceiver from "../components/InputReceiver"

export default class InputDebugSystem extends System {
  _actionDataUIElement: any
  _axisDataUIElement: any
  public execute(): void {
    this.queries.actionReceivers.changed.forEach(entity => {
      const values = entity.getComponent(InputActionHandler).buffer
      if (values.getBufferLength() > 0) {
        this._actionDataUIElement = document.getElementById("actionData")
        if (this._actionDataUIElement) {
          this._actionDataUIElement.innerHTML = values
            .toArray()
            .map((element, index) => {
              return index + ": " + element.action + " | " + element.value
            })
            .join("<br/>")
        }
      }
    })
    this.queries.axisReceivers.changed.forEach(entity => {
      const inputHandler = entity.getComponent(InputAxisHandler2D)
      if (inputHandler.buffer.getBufferLength() > 0) {
        console.log("Axes: " + inputHandler.buffer.getBufferLength())
      }

      this._axisDataUIElement = document.getElementById("axisData")
      if (this._axisDataUIElement) {
        this._axisDataUIElement.innerHTML = inputHandler.buffer
          .toArray()
          .map((element, index) => {
            return `${index}:  ${element.axis} | x: ${element.value.x} | y: ${element.value.y}`
          })
          .join("<br />")
      }
    })
  }
}

InputDebugSystem.queries = {
  actionReceivers: {
    components: [InputReceiver, InputActionHandler],
    listen: { changed: true }
  },
  axisReceivers: {
    components: [InputReceiver, InputAxisHandler2D],
    listen: { changed: true }
  }
}
