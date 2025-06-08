"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Container = void 0;

var _react = _interopRequireDefault(require("react"));

var _reactNative = require("react-native");

var _reactNativePagerView = _interopRequireDefault(require("react-native-pager-view"));

var _reactNativeReanimated = _interopRequireWildcard(require("react-native-reanimated"));

var _Context = require("./Context");

var _MaterialTabBar = require("./MaterialTabBar");

var _Tab = require("./Tab");

var _helpers = require("./helpers");

var _hooks = require("./hooks");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

const AnimatedPagerView = _reactNativeReanimated.default.createAnimatedComponent(_reactNativePagerView.default);
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


const Container = /*#__PURE__*/_react.default.memo( /*#__PURE__*/_react.default.forwardRef((_ref, ref) => {
  let {
    initialTabName,
    headerHeight: initialHeaderHeight,
    minHeaderHeight = 0,
    tabBarHeight: initialTabBarHeight = _MaterialTabBar.TABBAR_HEIGHT,
    revealHeaderOnScroll = false,
    snapThreshold,
    children,
    renderHeader,
    renderTabBar = props => /*#__PURE__*/_react.default.createElement(_MaterialTabBar.MaterialTabBar, props),
    headerContainerStyle,
    cancelTranslation,
    containerStyle,
    pagerProps,
    onIndexChange,
    onTabChange,
    width: customWidth,
    allowHeaderOverscroll
  } = _ref;
  const containerRef = (0, _hooks.useContainerRef)();
  const [tabProps, tabNamesArray] = (0, _hooks.useTabProps)(children, _Tab.Tab);
  const [refMap, setRef] = (0, _hooks.useAnimatedDynamicRefs)();
  const windowWidth = (0, _reactNative.useWindowDimensions)().width;
  const width = customWidth !== null && customWidth !== void 0 ? customWidth : windowWidth;
  const [containerHeight, getContainerLayoutHeight] = (0, _hooks.useLayoutHeight)();
  const [tabBarHeight, getTabBarHeight] = (0, _hooks.useLayoutHeight)(initialTabBarHeight);
  const [headerHeight, getHeaderHeight] = (0, _hooks.useLayoutHeight)(!renderHeader ? 0 : initialHeaderHeight);

  const initialIndex = _react.default.useMemo(() => initialTabName ? tabNamesArray.findIndex(n => n === initialTabName) : 0, [initialTabName, tabNamesArray]);

  const contentInset = _react.default.useMemo(() => {
    if (allowHeaderOverscroll) return 0; // necessary for the refresh control on iOS to be positioned underneath the header
    // this also adjusts the scroll bars to clamp underneath the header area

    return _helpers.IS_IOS ? (headerHeight || 0) + (tabBarHeight || 0) : 0;
  }, [headerHeight, tabBarHeight, allowHeaderOverscroll]);

  const snappingTo = (0, _reactNativeReanimated.useSharedValue)(0);
  const offset = (0, _reactNativeReanimated.useSharedValue)(0);
  const accScrollY = (0, _reactNativeReanimated.useSharedValue)(0);
  const oldAccScrollY = (0, _reactNativeReanimated.useSharedValue)(0);
  const accDiffClamp = (0, _reactNativeReanimated.useSharedValue)(0);
  const scrollYCurrent = (0, _reactNativeReanimated.useSharedValue)(0);
  const scrollY = (0, _reactNativeReanimated.useSharedValue)(Object.fromEntries(tabNamesArray.map(n => [n, 0])));
  const contentHeights = (0, _reactNativeReanimated.useSharedValue)(tabNamesArray.map(() => 0));
  const tabNames = (0, _reactNativeReanimated.useDerivedValue)(() => tabNamesArray, [tabNamesArray]);
  const index = (0, _reactNativeReanimated.useSharedValue)(initialIndex);
  const focusedTab = (0, _reactNativeReanimated.useDerivedValue)(() => {
    return tabNames.value[index.value];
  }, [tabNames]);
  const calculateNextOffset = (0, _reactNativeReanimated.useSharedValue)(initialIndex);
  const headerScrollDistance = (0, _reactNativeReanimated.useDerivedValue)(() => {
    return headerHeight !== undefined ? headerHeight - minHeaderHeight : 0;
  }, [headerHeight, minHeaderHeight]);
  const indexDecimal = (0, _reactNativeReanimated.useSharedValue)(index.value);
  const afterRender = (0, _reactNativeReanimated.useSharedValue)(0);

  _react.default.useEffect(() => {
    afterRender.value = (0, _reactNativeReanimated.withDelay)(_helpers.ONE_FRAME_MS * 5, (0, _reactNativeReanimated.withTiming)(1, {
      duration: 0
    }));
  }, [afterRender, tabNamesArray]);

  const resyncTabScroll = () => {
    'worklet';

    for (const name of tabNamesArray) {
      (0, _helpers.scrollToImpl)(refMap[name], 0, scrollYCurrent.value - contentInset, false);
    }
  }; // the purpose of this is to scroll to the proper position if dynamic tabs are changing


  (0, _reactNativeReanimated.useAnimatedReaction)(() => {
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

  (0, _reactNativeReanimated.useAnimatedReaction)(() => {
    const nextIndex = Math.round(indexDecimal.value);
    return nextIndex;
  }, nextIndex => {
    if (nextIndex !== null && nextIndex !== index.value) {
      calculateNextOffset.value = nextIndex;
    }
  }, []);

  const propagateTabChange = _react.default.useCallback(change => {
    onTabChange === null || onTabChange === void 0 ? void 0 : onTabChange(change);
    onIndexChange === null || onIndexChange === void 0 ? void 0 : onIndexChange(change.index);
  }, [onIndexChange, onTabChange]);

  const syncCurrentTabScrollPosition = () => {
    'worklet';

    const name = tabNamesArray[index.value];
    (0, _helpers.scrollToImpl)(refMap[name], 0, scrollYCurrent.value - contentInset, false);
  };
  /*
   * We run syncCurrentTabScrollPosition in every frame after the index
   * changes for about 1500ms because the Lists can be late to accept the
   * scrollTo event we send. This fixes the issue of the scroll position
   * jumping when the user changes tab.
   * */


  const toggleSyncScrollFrame = toggle => syncScrollFrame.setActive(toggle);

  const syncScrollFrame = (0, _reactNativeReanimated.useFrameCallback)(_ref2 => {
    let {
      timeSinceFirstFrame
    } = _ref2;
    syncCurrentTabScrollPosition();

    if (timeSinceFirstFrame > 1500) {
      (0, _reactNativeReanimated.runOnJS)(toggleSyncScrollFrame)(false);
    }
  }, false);
  (0, _reactNativeReanimated.useAnimatedReaction)(() => {
    return calculateNextOffset.value;
  }, i => {
    if (i !== index.value) {
      offset.value = scrollY.value[tabNames.value[index.value]] - scrollY.value[tabNames.value[i]] + offset.value;
      (0, _reactNativeReanimated.runOnJS)(propagateTabChange)({
        prevIndex: index.value,
        index: i,
        prevTabName: tabNames.value[index.value],
        tabName: tabNames.value[i]
      });
      index.value = i;

      if (typeof scrollY.value[tabNames.value[index.value]] === 'number') {
        scrollYCurrent.value = scrollY.value[tabNames.value[index.value]] || 0;
      }

      (0, _reactNativeReanimated.runOnJS)(toggleSyncScrollFrame)(true);
    }
  }, []);
  (0, _reactNativeReanimated.useAnimatedReaction)(() => headerHeight, (_current, prev) => {
    if (prev === undefined) {
      // sync scroll if we started with undefined header height
      resyncTabScroll();
    }
  });
  const headerTranslateY = (0, _reactNativeReanimated.useDerivedValue)(() => {
    return revealHeaderOnScroll ? -accDiffClamp.value : -Math.min(scrollYCurrent.value, headerScrollDistance.value);
  }, [revealHeaderOnScroll]);
  const stylez = (0, _reactNativeReanimated.useAnimatedStyle)(() => {
    return {
      transform: [{
        translateY: headerTranslateY.value
      }]
    };
  }, [revealHeaderOnScroll]);

  const onTabPress = _react.default.useCallback(name => {
    const i = tabNames.value.findIndex(n => n === name);

    if (name === focusedTab.value) {
      const ref = refMap[name];
      (0, _reactNativeReanimated.runOnUI)(_helpers.scrollToImpl)(ref, 0, headerScrollDistance.value - contentInset, true);
    } else {
      var _containerRef$current;

      (_containerRef$current = containerRef.current) === null || _containerRef$current === void 0 ? void 0 : _containerRef$current.setPage(i);
    }
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [containerRef, refMap, contentInset]);

  (0, _reactNativeReanimated.useAnimatedReaction)(() => tabNamesArray.length, tabLength => {
    if (index.value >= tabLength) {
      (0, _reactNativeReanimated.runOnJS)(onTabPress)(tabNamesArray[tabLength - 1]);
    }
  });
  const pageScrollHandler = (0, _hooks.usePageScrollHandler)({
    onPageScroll: e => {
      'worklet';

      indexDecimal.value = e.position + e.offset;
    }
  });

  _react.default.useImperativeHandle(ref, () => ({
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

  return /*#__PURE__*/_react.default.createElement(_Context.Context.Provider, {
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
  }, /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, {
    style: [styles.container, {
      width
    }, containerStyle],
    onLayout: getContainerLayoutHeight,
    pointerEvents: "box-none"
  }, /*#__PURE__*/_react.default.createElement(_reactNativeReanimated.default.View, {
    pointerEvents: "box-none",
    style: [styles.topContainer, headerContainerStyle, !cancelTranslation && stylez]
  }, /*#__PURE__*/_react.default.createElement(_reactNative.View, {
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
  })), /*#__PURE__*/_react.default.createElement(_reactNative.View, {
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
  }))), /*#__PURE__*/_react.default.createElement(AnimatedPagerView, _extends({
    ref: containerRef,
    onPageScroll: pageScrollHandler,
    initialPage: initialIndex
  }, pagerProps, {
    style: [pagerProps === null || pagerProps === void 0 ? void 0 : pagerProps.style, _reactNative.StyleSheet.absoluteFill]
  }), tabNamesArray.map((tabName, i) => {
    return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
      key: i,
      style: styles.pageContainer
    }, /*#__PURE__*/_react.default.createElement(_Context.TabNameContext.Provider, {
      value: tabName
    }, _react.default.Children.toArray(children)[i]));
  }))));
}));

exports.Container = Container;

const styles = _reactNative.StyleSheet.create({
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