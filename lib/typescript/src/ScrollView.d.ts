import React from 'react';
import { ScrollViewProps, ScrollView as RNScrollView } from 'react-native';
/**
 * Use like a regular ScrollView.
 */
export declare const ScrollView: React.ForwardRefExoticComponent<Omit<ScrollViewProps, "onScroll"> & {
    children?: React.ReactNode;
} & React.RefAttributes<RNScrollView>>;
