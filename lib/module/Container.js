function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { runOnJS, runOnUI, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withTiming, useFrameCallback } from 'react-native-reanimated';
import { Context, TabNameContext } from './Context';
import { MaterialTabBar, TABBAR_HEIGHT } from './MaterialTabBar';
import { Tab } from './Tab';
import { IS_IOS, ONE_FRAME_MS, scrollToImpl } from './helpers';
import { useAnimatedDynamicRefs, useContainerRef, usePageScrollHandler, useTabProps, useLayoutHeight } from './hooks';
const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);
/**
 * Basic usage looks like this:
 *
 * ```tsx
 * import { Tabs } from 'react-native-collapsible-tab-view'
 *
 * const Example = () => {
 *   return (
 *     <Tabs.Container renderHeader={MyHeader}>
 *       <Tabs.Tab name="A">
 *         <ScreenA />
 *       </Tabs.Tab>
 *       <Tabs.Tab name="B">
 *         <ScreenB />
 *       </Tabs.Tab>
 *     </Tabs.Container>
 *   )
 * }
 * ```
 */

export const Container = /*#__PURE__*/React.memo( /*#__PURE__*/React.forwardRef((_ref, ref) => {
  let {
    initialTabName,
    headerHeight: initialHeaderHeight,
    minHeaderHeight = 0,
    tabBarHeight: initialTabBarHeight = TABBAR_HEIGHT,
    revealHeaderOnScroll = false,
    snapThreshold,
    children,
    renderHeader,
    renderTabBar = props => /*#__PURE__*/React.createElement(MaterialTabBar, props),
    headerContainerStyle,
    cancelTranslation,
    containerStyle,
    pagerProps,
    onIndexChange,
    onTabChange,
    width: customWidth,
    allowHeaderOverscroll
  } = _ref;
  const containerRef = useContainerRef();
  const [tabProps, tabNamesArray] = useTabProps(children, Tab);
  const [refMap, setRef] = useAnimatedDynamicRefs();
  const windowWidth = useWindowDimensions().width;
  const width = customWidth !== null && customWidth !== void 0 ? customWidth : windowWidth;
  const [containerHeight, getContainerLayoutHeight] = useLayoutHeight();
  const [tabBarHeight, getTabBarHeight] = useLayoutHeight(initialTabBarHeight);
  const [headerHeight, getHeaderHeight] = useLayoutHeight(!renderHeader ? 0 : initialHeaderHeight);
  const initialIndex = React.useMemo(() => initialTabName ? tabNamesArray.findIndex(n => n === initialTabName) : 0, [initialTabName, tabNamesArray]);
  const contentInset = React.useMemo(() => {
    if (allowHeaderOverscroll) return 0; // necessary for the refresh control on iOS to be positioned underneath the header
    // this also adjusts the scroll bars to clamp underneath the header area

    return IS_IOS ? (headerHeight || 0) + (tabBarHeight || 0) : 0;
  }, [headerHeight, tabBarHeight, allowHeaderOverscroll]);
  const snappingTo = useSharedValue(0);
  const offset = useSharedValue(0);
  const accScrollY = useSharedValue(0);
  const oldAccScrollY = useSharedValue(0);
  const accDiffClamp = useSharedValue(0);
  const scrollYCurrent = useSharedValue(0);
  const scrollY = useSharedValue(Object.fromEntries(tabNamesArray.map(n => [n, 0])));
  const contentHeights = useSharedValue(tabNamesArray.map(() => 0));
  const tabNames = useDerivedValue(() => tabNamesArray, [tabNamesArray]);
  const index = useSharedValue(initialIndex);
  const focusedTab = useDerivedValue(() => {
    return tabNames.value[index.value];
  }, [tabNames]);
  const calculateNextOffset = useSharedValue(initialIndex);
  const headerScrollDistance = useDerivedValue(() => {
    return headerHeight !== undefined ? headerHeight - minHeaderHeight : 0;
  }, [headerHeight, minHeaderHeight]);
  const indexDecimal = useSharedValue(index.value);
  const afterRender = useSharedValue(0);
  React.useEffect(() => {
    afterRender.value = withDelay(ONE_FRAME_MS * 5, withTiming(1, {
      duration: 0
    }));
  }, [afterRender, tabNamesArray]);

  const resyncTabScroll = () => {
    'worklet';

    for (const name of tabNamesArray) {
      scrollToImpl(refMap[name], 0, scrollYCurrent.value - contentInset, false);
    }
  }; // the purpose of this is to scroll to the proper position if dynamic tabs are changing


  useAnimatedReaction(() => {
    return afterRender.value === 1;
  }, trigger => {
    if (trigger) {
      afterRender.value = 0;
      resyncTabScroll();
    }
  }, [tabNamesArray, refMap, afterRender, contentInset]); // derived from scrollX
  // calculate the next offset and index if swiping
  // if scrollX changes from tab press,
  // the same logic must be done, but knowing
  // the next index in advance

  useAnimatedReaction(() => {
    const nextIndex = Math.round(indexDecimal.value);
    return nextIndex;
  }, nextIndex => {
    if (nextIndex !== null && nextIndex !== index.value) {
      calculateNextOffset.value = nextIndex;
    }
  }, []);
  const propagateTabChange = React.useCallback(change => {
    onTabChange === null || onTabChange === void 0 ? void 0 : onTabChange(change);
    onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange(change.index);
  }, [onIndexChange, onTabChange]);

  const syncCurrentTabScrollPosition = () => {
    'worklet';

    const name = tabNamesArray[index.value];
    scrollToImpl(refMap[name], 0, scrollYCurrent.value - contentInset, false);
  };
  /*
   * We run syncCurrentTabScrollPosition in every frame after the index
   * changes for about 1500ms because the Lists can be late to accept the
   * scrollTo event we send. This fixes the issue of the scroll position
   * jumping when the user changes tab.
   * */


  const toggleSyncScrollFrame = toggle => syncScrollFrame.setActive(toggle);

  const syncScrollFrame = useFrameCallback(_ref2 => {
    let {
      timeSinceFirstFrame
    } = _ref2;
    syncCurrentTabScrollPosition();

    if (timeSinceFirstFrame > 1500) {
      runOnJS(toggleSyncScrollFrame)(false);
    }
  }, false);
  useAnimatedReaction(() => {
    return calculateNextOffset.value;
  }, i => {
    if (i !== index.value) {
      offset.value = scrollY.value[tabNames.value[index.value]] - scrollY.value[tabNames.value[i]] + offset.value;
      runOnJS(propagateTabChange)({
        prevIndex: index.value,
        index: i,
        prevTabName: tabNames.value[index.value],
        tabName: tabNames.value[i]
      });
      index.value = i;

      if (typeof scrollY.value[tabNames.value[index.value]] === 'number') {
        scrollYCurrent.value = scrollY.value[tabNames.value[index.value]] || 0;
      }

      runOnJS(toggleSyncScrollFrame)(true);
    }
  }, []);
  useAnimatedReaction(() => headerHeight, (_current, prev) => {
    if (prev === undefined) {
      // sync scroll if we started with undefined header height
      resyncTabScroll();
    }
  });
  const headerTranslateY = useDerivedValue(() => {
    return revealHeaderOnScroll ? -accDiffClamp.value : -Math.min(scrollYCurrent.value, headerScrollDistance.value);
  }, [revealHeaderOnScroll]);
  const stylez = useAnimatedStyle(() => {
    return {
      transform: [{
        translateY: headerTranslateY.value
      }]
    };
  }, [revealHeaderOnScroll]);
  const onTabPress = React.useCallback(name => {
    const i = tabNames.value.findIndex(n => n === name);

    if (name === focusedTab.value) {
      const ref = refMap[name];
      runOnUI(scrollToImpl)(ref, 0, headerScrollDistance.value - contentInset, true);
    } else {
      var _containerRef$current;

      (_containerRef$current = containerRef.current) === null || _containerRef$current === void 0 ? void 0 : _containerRef$current.setPage(i);
    }
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [containerRef, refMap, contentInset]);
  useAnimatedReaction(() => tabNamesArray.length, tabLength => {
    if (index.value >= tabLength) {
      runOnJS(onTabPress)(tabNamesArray[tabLength - 1]);
    }
  });
  const pageScrollHandler = usePageScrollHandler({
    onPageScroll: e => {
      'worklet';

      indexDecimal.value = e.position + e.offset;
    }
  });
  React.useImperativeHandle(ref, () => ({
    setIndex: index => {
      const name = tabNames.value[index];
      onTabPress(name);
      return true;
    },
    jumpToTab: name => {
      onTabPress(name);
      return true;
    },
    getFocusedTab: () => {
      return tabNames.value[index.value];
    },
    getCurrentIndex: () => {
      return index.value;
    }
  }), // eslint-disable-next-line react-hooks/exhaustive-deps
  [onTabPress]);
  return /*#__PURE__*/React.createElement(Context.Provider, {
    value: {
      contentInset,
      tabBarHeight,
      headerHeight,
      refMap,
      tabNames,
      index,
      snapThreshold,
      revealHeaderOnScroll,
      focusedTab,
      accDiffClamp,
      indexDecimal,
      containerHeight,
      minHeaderHeight,
      scrollYCurrent,
      scrollY,
      setRef,
      headerScrollDistance,
      accScrollY,
      oldAccScrollY,
      offset,
      snappingTo,
      contentHeights,
      headerTranslateY,
      width,
      allowHeaderOverscroll
    }
  }, /*#__PURE__*/React.createElement(Animated.View, {
    style: [styles.container, {
      width
    }, containerStyle],
    onLayout: getContainerLayoutHeight,
    pointerEvents: "box-none"
  }, /*#__PURE__*/React.createElement(Animated.View, {
    pointerEvents: "box-none",
    style: [styles.topContainer, headerContainerStyle, !cancelTranslation && stylez]
  }, /*#__PURE__*/React.createElement(View, {
    style: [styles.container, styles.headerContainer],
    onLayout: getHeaderHeight,
    pointerEvents: "box-none"
  }, renderHeader && renderHeader({
    containerRef,
    index,
    tabNames: tabNamesArray,
    focusedTab,
    indexDecimal,
    onTabPress,
    tabProps
  })), /*#__PURE__*/React.createElement(View, {
    style: [styles.container, styles.tabBarContainer],
    onLayout: getTabBarHeight,
    pointerEvents: "box-none"
  }, renderTabBar && renderTabBar({
    containerRef,
    index,
    tabNames: tabNamesArray,
    focusedTab,
    indexDecimal,
    width,
    onTabPress,
    tabProps
  }))), /*#__PURE__*/React.createElement(AnimatedPagerView, _extends({
    ref: containerRef,
    onPageScroll: pageScrollHandler,
    initialPage: initialIndex
  }, pagerProps, {
    style: [pagerProps === null || pagerProps === void 0 ? void 0 : pagerProps.style, StyleSheet.absoluteFill]
  }), tabNamesArray.map((tabName, i) => {
    return /*#__PURE__*/React.createElement(View, {
      key: i,
      style: styles.pageContainer
    }, /*#__PURE__*/React.createElement(TabNameContext.Provider, {
      value: tabName
    }, React.Children.toArray(children)[i]));
  }))));
}));
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  pageContainer: {
    height: '100%',
    width: '100%'
  },
  topContainer: {
    position: 'absolute',
    zIndex: 100,
    width: '100%',
    backgroundColor: 'white',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4
  },
  tabBarContainer: {
    zIndex: 1
  },
  headerContainer: {
    zIndex: 2
  }
});
//# sourceMappingURL=Container.js.map