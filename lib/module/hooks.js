import { useMemo, Children, useState, useCallback, useContext, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { cancelAnimation, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useSharedValue, withDelay, withTiming, interpolate, runOnJS, runOnUI, useEvent, useHandler, Extrapolation } from 'react-native-reanimated';
import { useDeepCompareMemo } from 'use-deep-compare';
import { Context, TabNameContext } from './Context';
import { IS_IOS, ONE_FRAME_MS, scrollToImpl } from './helpers';
export function useContainerRef() {
  return useAnimatedRef();
}
export function useAnimatedDynamicRefs() {
  const [map, setMap] = useState({});
  const setRef = useCallback((key, ref) => {
    setMap(map => ({ ...map,
      [key]: ref
    }));
    return ref;
  }, []);
  return [map, setRef];
}
export function useTabProps(children, tabType) {
  const options = useMemo(() => {
    const tabOptions = new Map();

    if (children) {
      Children.forEach(children, (element, index) => {
        if (!element) return;
        if (element.type !== tabType) throw new Error('Container children must be wrapped in a <Tabs.Tab ... /> component'); // make sure children is excluded otherwise our props will mutate too much

        const {
          name,
          children,
          ...options
        } = element.props;
        if (tabOptions.has(name)) throw new Error(`Tab names must be unique, ${name} already exists`);
        tabOptions.set(name, {
          index,
          name,
          ...options
        });
      });
    }

    return tabOptions;
  }, [children, tabType]);
  const optionEntries = Array.from(options.entries());
  const optionKeys = Array.from(options.keys());
  const memoizedOptions = useDeepCompareMemo(() => options, [optionEntries]);
  const memoizedTabNames = useDeepCompareMemo(() => optionKeys, [optionKeys]);
  return [memoizedOptions, memoizedTabNames];
}
/**
 * Hook exposing some useful variables.
 *
 * ```tsx
 * const { focusedTab, ...rest } = useTabsContext()
 * ```
 */

export function useTabsContext() {
  const c = useContext(Context);
  if (!c) throw new Error('useTabsContext must be inside a Tabs.Container');
  return c;
}
/**
 * Access the parent tab screen from any deep component.
 *
 * ```tsx
 * const tabName = useTabNameContext()
 * ```
 */

export function useTabNameContext() {
  const c = useContext(TabNameContext);
  if (!c) throw new Error('useTabNameContext must be inside a TabNameContext');
  return c;
}
export function useLayoutHeight() {
  let initialHeight = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  const [height, setHeight] = useState(initialHeight);
  const getHeight = useCallback(event => {
    const latestHeight = event.nativeEvent.layout.height;

    if (latestHeight !== height) {
      setHeight(latestHeight);
    }
  }, [height, setHeight]);
  return [height, getHeight];
}
/**
 * Hook to access some key styles that make the whole thing work.
 *
 * You can use this to get the progessViewOffset and pass to the refresh control of scroll view.
 */

export function useCollapsibleStyle() {
  const {
    headerHeight,
    tabBarHeight,
    containerHeight,
    width,
    allowHeaderOverscroll,
    minHeaderHeight
  } = useTabsContext();
  const containerHeightWithMinHeader = Math.max(0, (containerHeight !== null && containerHeight !== void 0 ? containerHeight : 0) - minHeaderHeight);
  return useMemo(() => ({
    style: {
      width
    },
    contentContainerStyle: {
      minHeight: IS_IOS && !allowHeaderOverscroll ? containerHeightWithMinHeader - (tabBarHeight || 0) : containerHeightWithMinHeader + (headerHeight || 0),
      paddingTop: IS_IOS && !allowHeaderOverscroll ? 0 : (headerHeight || 0) + (tabBarHeight || 0)
    },
    progressViewOffset: // on iOS we need the refresh control to be at the top if overscrolling
    IS_IOS && allowHeaderOverscroll ? 0 : // on android we need it below the header or it doesn't show because of z-index
    (headerHeight || 0) + (tabBarHeight || 0)
  }), [allowHeaderOverscroll, headerHeight, tabBarHeight, width, containerHeightWithMinHeader]);
}
export function useUpdateScrollViewContentSize(_ref) {
  let {
    name
  } = _ref;
  const {
    tabNames,
    contentHeights
  } = useTabsContext();
  const setContentHeights = useCallback((name, height) => {
    'worklet';

    const tabIndex = tabNames.value.indexOf(name);
    contentHeights.value[tabIndex] = height;
    contentHeights.value = [...contentHeights.value];
  }, [contentHeights, tabNames]);
  const scrollContentSizeChange = useCallback((_, h) => {
    runOnUI(setContentHeights)(name, h);
  }, [setContentHeights, name]);
  return scrollContentSizeChange;
}
/**
 * Allows specifying multiple functions to be called in a sequence with the same parameters
 * Useful because we handle some events and need to pass them forward so that the caller can handle them as well
 * @param fns array of functions to call
 * @returns a function that once called will call all passed functions
 */

export function useChainCallback(fns) {
  const callAll = useCallback(function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    fns.forEach(fn => {
      if (typeof fn === 'function') {
        fn(...args);
      }
    });
  }, [fns]);
  return callAll;
}
export function useScroller() {
  const {
    contentInset
  } = useTabsContext();
  const scroller = useCallback((ref, x, y, animated, _debugKey) => {
    'worklet';

    if (!ref) return; //! this is left here on purpose to ease troubleshooting (uncomment when necessary)
    // console.log(
    //   `${_debugKey}, y: ${y}, y adjusted: ${y - contentInset}`
    // )

    scrollToImpl(ref, x, y - contentInset, animated);
  }, [contentInset]);
  return scroller;
}
export const useScrollHandlerY = name => {
  const {
    accDiffClamp,
    focusedTab,
    snapThreshold,
    revealHeaderOnScroll,
    refMap,
    tabNames,
    headerHeight,
    contentInset,
    containerHeight,
    scrollYCurrent,
    scrollY,
    oldAccScrollY,
    accScrollY,
    offset,
    headerScrollDistance,
    snappingTo,
    contentHeights,
    indexDecimal,
    allowHeaderOverscroll
  } = useTabsContext();
  const enabled = useSharedValue(false);
  const scrollTo = useScroller();
  const enable = useCallback(toggle => {
    'worklet';

    enabled.value = toggle;
  }, [name, refMap, scrollTo]);
  /**
   * Helper value to track if user is dragging on iOS, because iOS calls
   * onMomentumEnd only after a vigorous swipe. If the user has finished the
   * drag, but the onMomentumEnd has never triggered, we need to manually
   * call it to sync the scenes.
   */

  const afterDrag = useSharedValue(0);
  const scrollAnimation = useSharedValue(undefined);
  useAnimatedReaction(() => scrollAnimation.value, val => {
    if (val !== undefined) {
      scrollTo(refMap[name], 0, val, false, '[useAnimatedReaction scroll]');
    }
  });

  const onMomentumEnd = () => {
    'worklet';

    if (!enabled.value) return;

    if (typeof snapThreshold === 'number') {
      if (revealHeaderOnScroll) {
        if (accDiffClamp.value > 0) {
          if (scrollYCurrent.value > headerScrollDistance.value * snapThreshold) {
            if (accDiffClamp.value <= headerScrollDistance.value * snapThreshold) {
              // snap down
              accDiffClamp.value = withTiming(0);
            } else if (accDiffClamp.value < headerScrollDistance.value) {
              // snap up
              accDiffClamp.value = withTiming(headerScrollDistance.value);

              if (scrollYCurrent.value < headerScrollDistance.value) {
                scrollAnimation.value = scrollYCurrent.value;
                scrollAnimation.value = withTiming(headerScrollDistance.value); //console.log('[${name}] sticky snap up')
              }
            }
          } else {
            accDiffClamp.value = withTiming(0);
          }
        }
      } else {
        if (scrollYCurrent.value <= headerScrollDistance.value * snapThreshold) {
          // snap down
          snappingTo.value = 0;
          scrollAnimation.value = scrollYCurrent.value;
          scrollAnimation.value = withTiming(0); //console.log('[${name}] snap down')
        } else if (scrollYCurrent.value <= headerScrollDistance.value) {
          // snap up
          snappingTo.value = headerScrollDistance.value;
          scrollAnimation.value = scrollYCurrent.value;
          scrollAnimation.value = withTiming(headerScrollDistance.value); //console.log('[${name}] snap up')
        }
      }
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (!enabled.value) return;

      if (focusedTab.value === name) {
        if (IS_IOS) {
          let {
            y
          } = event.contentOffset; // normalize the value so it starts at 0

          y = y + contentInset;
          const contentHeight = contentHeights.value[tabNames.value.indexOf(name)] || Number.MAX_VALUE;
          const clampMax = contentHeight - (containerHeight || 0) + contentInset; // make sure the y value is clamped to the scrollable size (clamps overscrolling)

          scrollYCurrent.value = allowHeaderOverscroll ? y : interpolate(y, [0, clampMax], [0, clampMax], Extrapolation.CLAMP);
        } else {
          const {
            y
          } = event.contentOffset;
          scrollYCurrent.value = y;
        }

        scrollY.value[name] = scrollYCurrent.value;
        oldAccScrollY.value = accScrollY.value;
        accScrollY.value = scrollY.value[name] + offset.value;

        if (revealHeaderOnScroll) {
          const delta = accScrollY.value - oldAccScrollY.value;
          const nextValue = accDiffClamp.value + delta;

          if (delta > 0) {
            // scrolling down
            accDiffClamp.value = Math.min(headerScrollDistance.value, nextValue);
          } else if (delta < 0) {
            // scrolling up
            accDiffClamp.value = Math.max(0, nextValue);
          }
        }
      }
    },
    onBeginDrag: () => {
      if (!enabled.value) return; // ensure the header stops snapping

      cancelAnimation(accDiffClamp);
      if (IS_IOS) cancelAnimation(afterDrag);
    },
    onEndDrag: () => {
      if (!enabled.value) return;

      if (IS_IOS) {
        // we delay this by one frame so that onMomentumBegin may fire on iOS
        afterDrag.value = withDelay(ONE_FRAME_MS, withTiming(0, {
          duration: 0
        }, isFinished => {
          // if the animation is finished, the onMomentumBegin has
          // never started, so we need to manually trigger the onMomentumEnd
          // to make sure we snap
          if (isFinished) {
            onMomentumEnd();
          }
        }));
      }
    },
    onMomentumBegin: () => {
      if (!enabled.value) return;

      if (IS_IOS) {
        cancelAnimation(afterDrag);
      }
    },
    onMomentumEnd
  }, [refMap, name, revealHeaderOnScroll, containerHeight, contentInset, snapThreshold, enabled, scrollTo]); // sync unfocused scenes

  useAnimatedReaction(() => {
    // if (!enabled.value) {
    //   return false
    // }
    // if the index is decimal, then we're in between panes
    const isChangingPane = !Number.isInteger(indexDecimal.value);
    return isChangingPane;
  }, (isSyncNeeded, wasSyncNeeded) => {
    if (isSyncNeeded && isSyncNeeded !== wasSyncNeeded && focusedTab.value !== name) {
      let nextPosition = null;
      const focusedScrollY = scrollY.value[focusedTab.value];
      const tabScrollY = scrollY.value[name];
      const areEqual = focusedScrollY === tabScrollY;

      if (!areEqual) {
        const currIsOnTop = tabScrollY + StyleSheet.hairlineWidth <= headerScrollDistance.value;
        const focusedIsOnTop = focusedScrollY + StyleSheet.hairlineWidth <= headerScrollDistance.value;

        if (revealHeaderOnScroll) {
          const hasGap = accDiffClamp.value > tabScrollY;

          if (hasGap || currIsOnTop) {
            nextPosition = accDiffClamp.value;
          }
        } else if (typeof snapThreshold === 'number') {
          if (focusedIsOnTop) {
            nextPosition = snappingTo.value;
          } else if (currIsOnTop) {
            nextPosition = headerHeight || 0;
          }
        } else if (currIsOnTop || focusedIsOnTop) {
          nextPosition = Math.min(focusedScrollY, headerScrollDistance.value);
        }
      }

      if (nextPosition !== null) {
        // console.log(`sync ${name} ${nextPosition}`)
        scrollY.value[name] = nextPosition;
        scrollTo(refMap[name], 0, nextPosition, false, `[${name}] sync pane`);
      }
    }
  }, [revealHeaderOnScroll, refMap, snapThreshold, enabled, scrollTo]);
  return {
    scrollHandler,
    enable
  };
};

/**
 * Magic hook that creates a multicast ref. Useful so that we can both capture the ref, and forward it to callers.
 * Accepts a parameter for an outer ref that will also be updated to the same ref
 * @param outerRef the outer ref that needs to be updated
 * @returns an animated ref
 */
export function useSharedAnimatedRef(outerRef) {
  const ref = useAnimatedRef(); // this executes on every render

  useEffect(() => {
    if (!outerRef) {
      return;
    }

    if (typeof outerRef === 'function') {
      outerRef(ref.current);
    } else {
      outerRef.current = ref.current;
    }
  });
  return ref;
}
export function useAfterMountEffect(nextOnLayout, effect) {
  const didExecute = useRef(false);
  const didMount = useSharedValue(false);
  useAnimatedReaction(() => {
    return didMount.value;
  }, (didMount, prevDidMount) => {
    if (didMount && !prevDidMount) {
      if (didExecute.current) return;
      effect();
      didExecute.current = true;
    }
  });
  const onLayoutOut = useCallback(event => {
    requestAnimationFrame(() => {
      didMount.value = true;
    });
    return nextOnLayout === null || nextOnLayout === void 0 ? void 0 : nextOnLayout(event);
  }, [didMount, nextOnLayout]);
  return onLayoutOut;
}
export function useConvertAnimatedToValue(animatedValue) {
  const [value, setValue] = useState(animatedValue.value);
  useAnimatedReaction(() => {
    return animatedValue.value;
  }, animValue => {
    if (animValue !== value) {
      runOnJS(setValue)(animValue);
    }
  }, [value]);
  return value || 0;
}
export function useHeaderMeasurements() {
  const {
    headerTranslateY,
    headerHeight
  } = useTabsContext();
  return {
    top: headerTranslateY,
    height: headerHeight
  };
}
/**
 * Returns the vertical scroll position of the current tab as an Animated SharedValue
 */

export function useCurrentTabScrollY() {
  const {
    scrollYCurrent
  } = useTabsContext();
  return scrollYCurrent;
}
/**
 * Returns the currently focused tab name
 */

export function useFocusedTab() {
  const {
    focusedTab
  } = useTabsContext();
  const focusedTabValue = useConvertAnimatedToValue(focusedTab);
  return focusedTabValue;
}
/**
 * Returns an animated value representing the current tab index, as a floating point number
 */

export function useAnimatedTabIndex() {
  const {
    indexDecimal
  } = useTabsContext();
  return indexDecimal;
}
export const usePageScrollHandler = (handlers, dependencies) => {
  const {
    context,
    doDependenciesDiffer
  } = useHandler(handlers, dependencies);
  const subscribeForEvents = ['onPageScroll'];
  return useEvent(event => {
    'worklet';

    const {
      onPageScroll
    } = handlers;

    if (onPageScroll && event.eventName.endsWith('onPageScroll')) {
      onPageScroll(event, context);
    }
  }, subscribeForEvents, doDependenciesDiffer);
};
//# sourceMappingURL=hooks.js.map