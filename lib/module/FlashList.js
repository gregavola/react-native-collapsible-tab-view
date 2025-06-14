function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

import React, { useCallback } from 'react';
import Animated, { useSharedValue, useAnimatedReaction } from 'react-native-reanimated';
import { useChainCallback, useCollapsibleStyle, useScrollHandlerY, useSharedAnimatedRef, useTabNameContext, useTabsContext, useUpdateScrollViewContentSize } from './hooks';
/**
 * Used as a memo to prevent rerendering too often when the context changes.
 * See: https://github.com/facebook/react/issues/15156#issuecomment-474590693
 */

let AnimatedFlashList = null;

const ensureFlastList = () => {
  if (AnimatedFlashList) {
    return;
  }

  try {
    const flashListModule = require('@shopify/flash-list');

    AnimatedFlashList = Animated.createAnimatedComponent(flashListModule.FlashList);
  } catch {
    console.error('The optional dependency @shopify/flash-list is not installed. Please install it to use the FlashList component.');
  }
};

const FlashListMemo = /*#__PURE__*/React.memo( /*#__PURE__*/React.forwardRef((props, passRef) => {
  ensureFlastList();
  return AnimatedFlashList ? /*#__PURE__*/React.createElement(AnimatedFlashList, _extends({
    ref: passRef
  }, props)) : /*#__PURE__*/React.createElement(React.Fragment, null);
}));

function FlashListImpl(_ref, passRef) {
  let {
    style,
    onContentSizeChange,
    refreshControl,
    contentContainerStyle: _contentContainerStyle,
    ...rest
  } = _ref;
  const name = useTabNameContext();
  const {
    setRef,
    contentInset
  } = useTabsContext();
  const ref = useSharedAnimatedRef(passRef);
  const recyclerRef = useSharedAnimatedRef(null);
  const {
    scrollHandler,
    enable
  } = useScrollHandlerY(name);
  const hadLoad = useSharedValue(false);
  const onLoad = useCallback(() => {
    hadLoad.value = true;
  }, [hadLoad]);
  useAnimatedReaction(() => {
    return hadLoad.value;
  }, ready => {
    if (ready) {
      enable(true);
    }
  });
  const {
    progressViewOffset,
    contentContainerStyle
  } = useCollapsibleStyle();
  React.useEffect(() => {
    setRef(name, recyclerRef);
  }, [name, recyclerRef, setRef]);
  const scrollContentSizeChange = useUpdateScrollViewContentSize({
    name
  });
  const scrollContentSizeChangeHandlers = useChainCallback(React.useMemo(() => [scrollContentSizeChange, onContentSizeChange], [onContentSizeChange, scrollContentSizeChange]));
  const memoRefreshControl = React.useMemo(() => refreshControl && /*#__PURE__*/React.cloneElement(refreshControl, {
    progressViewOffset,
    ...refreshControl.props
  }), [progressViewOffset, refreshControl]);
  const memoContentInset = React.useMemo(() => ({
    top: contentInset
  }), [contentInset]);
  const memoContentOffset = React.useMemo(() => ({
    x: 0,
    y: -contentInset
  }), [contentInset]);
  const memoContentContainerStyle = React.useMemo(() => ({
    paddingTop: contentContainerStyle.paddingTop,
    ..._contentContainerStyle
  }), [_contentContainerStyle, contentContainerStyle.paddingTop]);
  const refWorkaround = useCallback(value => {
    // https://github.com/Shopify/flash-list/blob/2d31530ed447a314ec5429754c7ce88dad8fd087/src/FlashList.tsx#L829
    // We are not accessing the right element or view of the Flashlist (recyclerlistview). So we need to give
    // this ref the access to it
    // eslint-ignore
    ;
    recyclerRef(value === null || value === void 0 ? void 0 : value.recyclerlistview_unsafe);
    ref(value);
  }, [recyclerRef, ref]);
  return (
    /*#__PURE__*/
    // @ts-expect-error typescript complains about `unknown` in the memo, it should be T
    React.createElement(FlashListMemo, _extends({}, rest, {
      onLoad: onLoad,
      ref: refWorkaround,
      contentContainerStyle: memoContentContainerStyle,
      bouncesZoom: false,
      onScroll: scrollHandler,
      scrollEventThrottle: 16,
      contentInset: memoContentInset,
      contentOffset: memoContentOffset,
      refreshControl: memoRefreshControl,
      progressViewOffset: progressViewOffset,
      automaticallyAdjustContentInsets: false,
      onContentSizeChange: scrollContentSizeChangeHandlers
    }))
  );
}
/**
 * Use like a regular FlashList.
 */


export const FlashList = /*#__PURE__*/React.forwardRef(FlashListImpl);
//# sourceMappingURL=FlashList.js.map