// Animation families (original implementations). Each family file exports its registry; see the .md catalogs in ../fx/ for the purpose of each id.
import { FX_AROUND } from './around';
import { FX_CARDS3D } from './cards3d';
import { FX_TYPE } from './type';
import { FX_DATA } from './data';
import { FX_MOTIONFX } from './motionfx';
import { FX_TRANSITIONS } from './transitions';
import { FX_REELS } from './reels';
import { FX_UI } from './ui';
export { FORMAT_ELEMENTS } from './formats';

export const FX_CLEAN = { ...FX_AROUND, ...FX_CARDS3D, ...FX_TYPE, ...FX_DATA, ...FX_MOTIONFX, ...FX_TRANSITIONS, ...FX_REELS, ...FX_UI };
