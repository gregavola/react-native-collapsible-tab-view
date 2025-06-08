/// <reference types="react" />
import { Container } from './Container';
import { FlashList } from './FlashList';
import { FlatList } from './FlatList';
import { Lazy } from './Lazy';
import { MasonryFlashList } from './MasonryFlashList';
import { MaterialTabBarProps, MaterialTabItemProps } from './MaterialTabBar';
import { ScrollView } from './ScrollView';
import { SectionList } from './SectionList';
import { Tab } from './Tab';
import { TabBarProps, CollapsibleProps, RefComponent, ContainerRef, CollapsibleRef, OnTabChangeCallback, TabItemProps, TabProps } from './types';
export type { TabBarProps, CollapsibleProps, RefComponent, ContainerRef, MaterialTabBarProps, MaterialTabItemProps, CollapsibleRef, OnTabChangeCallback, TabItemProps, TabProps, };
export declare const Tabs: {
    Container: import("react").MemoExoticComponent<import("react").ForwardRefExoticComponent<CollapsibleProps & import("react").RefAttributes<CollapsibleRef>>>;
    Tab: typeof Tab;
    Lazy: import("react").FC<{
        cancelLazyFadeIn?: boolean | undefined;
        mountDelayMs?: number | undefined;
        startMounted?: boolean | undefined;
        children: import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
    }>;
    FlatList: <T>(p: import("react-native").FlatListProps<T> & {
        ref?: import("react").Ref<import("react-native").FlatList<T>> | undefined;
    }) => import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
    ScrollView: import("react").ForwardRefExoticComponent<Omit<import("react-native").ScrollViewProps, "onScroll"> & {
        children?: import("react").ReactNode;
    } & import("react").RefAttributes<import("react-native").ScrollView>>;
    SectionList: <T_1>(p: import("react-native").SectionListProps<T_1, import("react-native").DefaultSectionT> & {
        ref?: import("react").Ref<import("react-native").SectionList<T_1, import("react-native").DefaultSectionT>> | undefined;
    }) => import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
    FlashList: <T_2>(p: import("@shopify/flash-list").FlashListProps<T_2> & {
        ref?: import("react").Ref<import("@shopify/flash-list").FlashList<T_2>> | undefined;
    }) => import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
    MasonryFlashList: <T_3>(p: import("@shopify/flash-list").MasonryFlashListProps<T_3> & {
        ref?: import("react").Ref<import("@shopify/flash-list").MasonryFlashListRef<any>> | undefined;
    }) => import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
};
export { Container, Tab, Lazy, FlatList, ScrollView, SectionList, FlashList, MasonryFlashList, };
export { useCurrentTabScrollY, useHeaderMeasurements, useFocusedTab, useAnimatedTabIndex, useCollapsibleStyle, } from './hooks';
export type { HeaderMeasurements } from './hooks';
export { MaterialTabBar } from './MaterialTabBar/TabBar';
export { MaterialTabItem } from './MaterialTabBar/TabItem';
