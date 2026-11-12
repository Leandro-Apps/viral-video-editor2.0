// Animation registry: the original families live in ../fx2 (see fx2/CATALOG.md); the demo, broll, smooth-scroll, keyword and STACK elements live here.
import { FX_CLEAN } from '../fx2';
import { FX_DEMO } from './demo';
import { FX_BROLL } from './broll';
import { FX_SMOOTH } from './smoothscroll';
import { FX_KW } from './kwfx';
import { FX_STACK } from './stack';

export const FX = { ...FX_CLEAN, ...FX_DEMO, ...FX_BROLL, ...FX_SMOOTH, ...FX_KW, ...FX_STACK };
