/// <reference types="react" />
import { AnimatedRef } from 'react-native-reanimated';
import { RefComponent } from './types';
/** The time one frame takes at 60 fps (16 ms) */
export declare const ONE_FRAME_MS = 16;
/** check if app is in RTL mode or not */
export declare const isRTL: boolean;
export declare const IS_IOS: boolean;
export declare const AnimatedFlatList: import("react").ComponentClass<import("react-native-reanimated").AnimateProps<import("react-native").FlatListProps<unknown>>, any>;
export declare const AnimatedSectionList: import("react").ComponentClass<import("react-native-reanimated").AnimateProps<import("react-native").SectionListProps<unknown, unknown>>, any>;
export declare function scrollToImpl<T extends RefComponent>(ref: AnimatedRef<T> | undefined, x: number, y: number, animated: boolean): void;
