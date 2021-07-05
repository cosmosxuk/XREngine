import { NetworkPlayerCharacter } from '../../character/prefabs/NetworkPlayerCharacter';
import { NetworkRigidBody } from '../../interaction/prefabs/NetworkRigidBody';
import { NetworkMediaStream } from '../../scene/prefabs/NetworkMediaStream';
import { NetworkVehicle } from '../../vehicle/prefabs/NetworkVehicle';
import { MessageTypes } from '../enums/MessageTypes';
import { NetworkSchema } from '../interfaces/NetworkSchema';
import { PrefabType } from './PrefabType';

export const DefaultPrefabs = {
  [PrefabType.Player]: NetworkPlayerCharacter,
  [PrefabType.RigidBody]: NetworkRigidBody,
  [PrefabType.Vehicle]: NetworkVehicle,
  [PrefabType.MediaStream]: NetworkMediaStream,
};

export const DefaultNetworkSchema: NetworkSchema = {
  transport: null,
  messageTypes: {
    ...MessageTypes
  },
  prefabs: DefaultPrefabs,
  defaultClientPrefab: PrefabType.Player
};
