import { CharacterComponent } from '../../../character/components/CharacterComponent';
import { StartWalkForwardState } from '../states/StartWalkForwardState';
import { getComponent } from '../../../ecs/functions/EntityFunctions';
import { addState } from '../../../state/behaviors/StateBehaviors';

export const checkMoving: Behavior = (entity, args: { transitionToState: any; }, deltaTime) => {
  const character = getComponent<CharacterComponent>(entity, CharacterComponent as any);
  // TODO: Arbitrary 
  if (character.velocity.length() > (0.1 * deltaTime)) {
    console.log("Change state to walking forward");
    addState(entity, { state: args.transitionToState });
  }
};
