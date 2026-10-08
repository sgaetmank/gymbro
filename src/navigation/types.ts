import type { NavigatorScreenParams } from '@react-navigation/native';

import type { RoutineDay } from '../data/routines';
import type { User } from '../data/users';

export type AppStackParamList = {
  login: undefined;
  signup: undefined;
  TrainerTabs: undefined;
  UserTabs: NavigatorScreenParams<UserTabParamList>;
  escanear_qr_user: undefined;
};

export type TrainerStackParamList = {
  buscar_usuario_trainer_root: undefined;
  ver_datos_trainer: { user: User };
  editar_rutina_trainer: { user: User };
};

export type TrainerTabParamList = {
  buscar_usuario_trainer: NavigatorScreenParams<TrainerStackParamList>;
  mi_cuenta_trainer: undefined;
};

export type UserRoutineStackParamList = {
  mi_rutina_user_root: undefined;
  ver_dia_x_user: { day: RoutineDay };
};

export type UserTabParamList = {
  home_user: undefined;
  mi_rutina_user: NavigatorScreenParams<UserRoutineStackParamList> | undefined;
  reloj: undefined;
  estadisticas_user: undefined;
  mi_cuenta_user: undefined;
};
