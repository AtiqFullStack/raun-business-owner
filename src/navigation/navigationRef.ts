import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import type { RootStackParamList } from './index';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type NavigateArgs<RouteName extends keyof RootStackParamList> =
  undefined extends RootStackParamList[RouteName]
  ?
  | [screen: RouteName]
  | [screen: RouteName, params: RootStackParamList[RouteName]]
  : [screen: RouteName, params: RootStackParamList[RouteName]];

export function navigate<RouteName extends keyof RootStackParamList>(
  ...args: NavigateArgs<RouteName>
): void;
export function navigate(
  ...args: [
    keyof RootStackParamList,
    RootStackParamList[keyof RootStackParamList]?,
  ]
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.navigate({
        name: args[0],
        params: args[1],
      }),
    );
  }
}

export function resetTo<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name, params }],
      }),
    );
  }
}
